import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_LOG_OPTIONS, AUDIT_LOG_STORAGE } from './audit-log.constants';
import type { AuditLogModuleOptions } from './audit-log.options';
import type {
  AuditQueryFilters,
  AuditStorageAdapter,
  PaginatedResult,
} from './storage/storage.adapter';

export interface ManualAuditEntry {
  action: string;
  resource: string;
  resourceId?: string;
  actor?: Record<string, unknown>;
  before?: unknown;
  after?: unknown;
  body?: unknown;
  request?: Partial<{
    ip: string;
    method: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, unknown>;
    headers: Record<string, string | string[] | undefined>;
  }>;
}

@Injectable()
export class AuditLogService<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  constructor(
    @Inject(AUDIT_LOG_OPTIONS) private readonly options: AuditLogModuleOptions<TRecord>,
    @Inject(AUDIT_LOG_STORAGE) private readonly storage: AuditStorageAdapter<TRecord>,
  ) {}

  async log(entry: ManualAuditEntry): Promise<void> {
    const record = this.options.schema({
      request: {
        ip: entry.request?.ip ?? '',
        method: entry.request?.method ?? '',
        path: entry.request?.path ?? '',
        params: entry.request?.params ?? {},
        query: entry.request?.query ?? {},
        headers: entry.request?.headers ?? {},
      },
      actor: entry.actor ?? {},
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      body: entry.body,
      before: entry.before,
      after: entry.after,
      diff: undefined,
      timestamp: new Date(),
      traceId: undefined,
      error: undefined,
    });

    await this.storage.save(record);
  }

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<TRecord>> {
    if (!this.storage.query) {
      return {
        items: [],
        total: 0,
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
      };
    }
    return this.storage.query(filters);
  }

  async flush(): Promise<void> {
    await this.storage.flush?.();
  }
}
