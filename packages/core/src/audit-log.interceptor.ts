import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Observable, defer, from, mergeMap, throwError, catchError } from 'rxjs';
import { AUDIT_LOG_METADATA, AUDIT_LOG_OPTIONS, AUDIT_LOG_STORAGE } from './audit-log.constants';
import { AuditLogMetadata } from './audit-log.decorator';
import type { AuditLogModuleOptions } from './audit-log.options';
import { computeDiff } from './diff/deep-diff';
import { maskFields } from './mask/field-masker';
import { buildAuditContextInput, getActorFromRequest, RequestLike } from './request-context';
import type { AuditContext } from './schema/audit-context';
import type { AuditStorageAdapter } from './storage/storage.adapter';

interface MetadataReflector {
  get<T = unknown>(metadataKey: string, target: unknown): T | undefined;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUDIT_LOG_OPTIONS) private readonly options: AuditLogModuleOptions,
    @Inject(AUDIT_LOG_STORAGE) private readonly storage: AuditStorageAdapter,
    @Optional() @Inject(Reflector) private readonly reflector: MetadataReflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.getMetadata(context);
    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestLike>();
    const actor = getActorFromRequest(request);
    const baseContext = buildAuditContextInput(request, actor, metadata);

    return defer(() =>
      from(this.prepareBefore(metadata, baseContext)).pipe(
        mergeMap((before) =>
          next.handle().pipe(
            mergeMap((responseBody) =>
              from(this.persistSuccess(request, actor, metadata, before)).pipe(
                mergeMap(() => from([responseBody])),
              ),
            ),
            catchError((error: unknown) =>
              from(this.persistError(request, actor, metadata, before, error)).pipe(
                mergeMap(() => throwError(() => error)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  private getMetadata(context: ExecutionContext): AuditLogMetadata | undefined {
    return (
      this.reflector?.get<AuditLogMetadata>(AUDIT_LOG_METADATA, context.getHandler()) ??
      this.reflector?.get<AuditLogMetadata>(AUDIT_LOG_METADATA, context.getClass())
    );
  }

  private async prepareBefore(metadata: AuditLogMetadata, context: AuditContext): Promise<unknown> {
    if (await metadata.skip?.(context)) {
      return SKIP_AUDIT;
    }

    return metadata.beforeFn?.(context, this.moduleRef);
  }

  private async persistSuccess(
    request: RequestLike,
    actor: Record<string, unknown>,
    metadata: AuditLogMetadata,
    before: unknown,
  ): Promise<void> {
    if (before === SKIP_AUDIT) {
      return;
    }

    const afterContext = buildAuditContextInput(request, actor, metadata, { before });
    const after = await metadata.afterFn?.(afterContext, this.moduleRef);
    const diff = computeDiff(before, after);
    const context = buildAuditContextInput(request, actor, metadata, { before, after, diff });
    await this.persistContext(metadata, context);
  }

  private async persistError(
    request: RequestLike,
    actor: Record<string, unknown>,
    metadata: AuditLogMetadata,
    before: unknown,
    error: unknown,
  ): Promise<void> {
    if (before === SKIP_AUDIT || !this.options.logErrors) {
      return;
    }

    const context = buildAuditContextInput(request, actor, metadata, {
      before,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    await this.persistContext(metadata, context);
  }

  private async persistContext(metadata: AuditLogMetadata, context: AuditContext): Promise<void> {
    const record = this.options.schema(context);
    const masked = maskFields(record, [...(this.options.mask ?? []), ...(metadata.mask ?? [])]);

    if (this.options.async === false) {
      await this.storage.save(masked);
      return;
    }

    setImmediate(() => {
      void this.storage.save(masked);
    });
  }
}

const SKIP_AUDIT = Symbol('SKIP_AUDIT');
