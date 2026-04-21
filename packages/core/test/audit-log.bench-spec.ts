import { CallHandler, ExecutionContext } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import 'reflect-metadata';
import { of } from 'rxjs';
import { AuditLogMetadata } from '../src';
import { ACTOR_REQUEST_KEY, AUDIT_LOG_METADATA } from '../src/audit-log.constants';
import { AuditLogInterceptor } from '../src/audit-log.interceptor';
import { InMemoryAuditAdapter } from '../src/storage/memory.adapter';

describe('AuditLogInterceptor benchmark', () => {
  it('keeps async interceptor overhead below 2ms per pass', async () => {
    const iterations = 1000;
    const storage = new InMemoryAuditAdapter();
    const interceptor = createInterceptor(storage);

    const startedAt = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      await runInterceptor(interceptor, index);
    }
    const averageMs = (performance.now() - startedAt) / iterations;

    expect(averageMs).toBeLessThan(2);
  });
});

function createInterceptor(storage: InMemoryAuditAdapter): AuditLogInterceptor {
  return new AuditLogInterceptor(
    {
      schema: (ctx) => ({
        timestamp: ctx.timestamp,
        actorId: typeof ctx.actor.sub === 'string' ? ctx.actor.sub : '',
        action: ctx.action,
        resource: ctx.resource,
        resourceId: ctx.resourceId,
        diff: ctx.diff,
      }),
      storage: { type: 'memory' },
      async: true,
    },
    storage,
    {
      get: <T = unknown>(_key: string, target: unknown) =>
        Reflect.getMetadata(AUDIT_LOG_METADATA, target as object) as T | undefined,
    },
    { get: () => undefined } as never,
  );
}

function runInterceptor(interceptor: AuditLogInterceptor, index: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    interceptor
      .intercept(createContext(index), { handle: () => of({ ok: true }) } as CallHandler)
      .subscribe({
        complete: resolve,
        error: reject,
      });
  });
}

function createContext(index: number): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class BenchController {},
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        method: 'PATCH',
        path: `/bench/${index}`,
        params: { id: String(index) },
        query: {},
        headers: {},
        [ACTOR_REQUEST_KEY]: { sub: 'bench-user' },
      }),
    }),
  } as unknown as ExecutionContext;
}

const metadata: AuditLogMetadata = {
  action: 'UPDATE',
  resource: 'Bench',
  resourceId: (ctx) => ctx.request.params.id,
  beforeFn: () => ({ value: 'old' }),
  afterFn: () => ({ value: 'new' }),
};

function handler() {
  return undefined;
}

Reflect.defineMetadata(AUDIT_LOG_METADATA, metadata, handler);
