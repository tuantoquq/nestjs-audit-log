import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { AuditLogMetadata } from '../src';
import { ACTOR_REQUEST_KEY, AUDIT_LOG_METADATA } from '../src/audit-log.constants';
import { AuditLogInterceptor } from '../src/audit-log.interceptor';
import { InMemoryAuditAdapter } from '../src';

describe('AuditLogInterceptor', () => {
  it('captures before, after, diff, and masked fields', async () => {
    const storage = new InMemoryAuditAdapter();
    const interceptor = createInterceptorForMetadata(
      {
        action: 'UPDATE',
        resource: 'User',
        resourceId: '123',
        beforeFn: () => ({ email: 'old@example.com', password: 'old' }),
        afterFn: () => ({ email: 'new@example.com', password: 'new' }),
        mask: ['after.password'],
      },
      storage,
      { async: false, mask: ['before.password'] },
    );

    await runInterceptor(
      interceptor,
      { body: { password: 'body-secret' }, [ACTOR_REQUEST_KEY]: { id: 'user-1' } },
      { ok: true },
    );

    expect(storage.records[0]).toMatchObject({
      action: 'UPDATE',
      resourceId: '123',
      after: { email: 'new@example.com', password: '[MASKED]' },
      diff: {
        email: { from: 'old@example.com', to: 'new@example.com', kind: 'E' },
      },
    });
  });

  it('does not write when skip returns true', async () => {
    const metadata = { action: 'UPDATE', resource: 'User', skip: () => true };
    const storage = new InMemoryAuditAdapter();
    const interceptor = createInterceptorForMetadata(metadata, storage, {
      async: false,
    });

    await runInterceptor(interceptor, { body: {} }, { ok: true });

    expect(storage.records).toEqual([]);
  });

  it('uses an empty actor when the request has no attached actor', async () => {
    const storage = new InMemoryAuditAdapter();
    const interceptor = createInterceptorForMetadata(
      { action: 'CREATE', resource: 'User' },
      storage,
      { async: false },
    );

    await runInterceptor(interceptor, { body: {} }, { ok: true });

    expect(storage.records[0]).toMatchObject({ action: 'CREATE' });
  });

  it('logs failed requests when logErrors is true and rethrows the original error', async () => {
    const error = new Error('boom');
    const storage = new InMemoryAuditAdapter();
    const interceptor = createInterceptorForMetadata(
      { action: 'DELETE', resource: 'User' },
      storage,
      {
        async: false,
        logErrors: true,
      },
    );

    await expect(runFailingInterceptor(interceptor, error)).rejects.toBe(error);
    expect(storage.records[0]).toMatchObject({ action: 'DELETE' });
  });
});

function createInterceptorForMetadata(
  metadata: AuditLogMetadata,
  storage: InMemoryAuditAdapter,
  options: { async?: boolean; logErrors?: boolean; mask?: string[] } = {},
): AuditLogInterceptor {
  const handler = function handler() {
    return undefined;
  };
  Reflect.defineMetadata(AUDIT_LOG_METADATA, metadata, handler);
  metadataTargets.push(handler);

  return new AuditLogInterceptor(
    {
      schema: (ctx) => ({
        action: ctx.action,
        resourceId: ctx.resourceId,
        before: ctx.before,
        after: ctx.after,
        diff: ctx.diff,
        error: ctx.error?.message,
      }),
      storage: { type: 'memory' },
      ...options,
    },
    storage,
    {
      get: <T = unknown>(_key: string, target: unknown) => {
        const rawMetadata: unknown = Reflect.getMetadata(AUDIT_LOG_METADATA, target as object);
        return rawMetadata as T | undefined;
      },
    },
    { get: () => undefined } as never,
  );
}

function runInterceptor(
  interceptor: AuditLogInterceptor,
  requestOverrides: Record<string, unknown>,
  responseBody: unknown,
): Promise<void> {
  return subscribeTo(interceptor, requestOverrides, of(responseBody));
}

function runFailingInterceptor(interceptor: AuditLogInterceptor, error: Error): Promise<void> {
  return subscribeTo(
    interceptor,
    {},
    throwError(() => error),
  );
}

function subscribeTo(
  interceptor: AuditLogInterceptor,
  requestOverrides: Record<string, unknown>,
  stream: Observable<unknown>,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    interceptor
      .intercept(createContext(requestOverrides), { handle: () => stream } as CallHandler)
      .subscribe({
        complete: resolve,
        error: reject,
      });
  });
}

function createContext(requestOverrides: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => findLatestMetadataTarget(),
    getClass: () => class UsersController {},
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        method: 'PATCH',
        path: '/users/123',
        params: { id: '123' },
        query: {},
        headers: {},
        ...requestOverrides,
      }),
    }),
  } as unknown as ExecutionContext;
}

function findLatestMetadataTarget(): object {
  const candidates = metadataTargets;
  const latest = candidates[candidates.length - 1];
  if (!latest) {
    throw new Error('Expected metadata target');
  }
  return latest;
}

const metadataTargets: object[] = [];
