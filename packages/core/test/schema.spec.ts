import { defineAuditSchema } from '../src';

describe('defineAuditSchema', () => {
  it('returns the factory result without changing the shape', () => {
    const schema = defineAuditSchema((ctx) => ({
      actorId: ctx.actor.sub as string,
      action: ctx.action,
      timestamp: ctx.timestamp,
    }));

    const record = schema({
      request: {
        ip: '127.0.0.1',
        method: 'PATCH',
        path: '/users/123',
        params: { id: '123' },
        query: {},
        headers: {},
      },
      actor: { sub: 'user-1' },
      action: 'UPDATE',
      resource: 'User',
      resourceId: '123',
      body: { email: 'new@example.com' },
      before: undefined,
      after: undefined,
      diff: undefined,
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      traceId: 'trace-1',
      error: undefined,
    });

    expect(record).toEqual({
      actorId: 'user-1',
      action: 'UPDATE',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
  });
});
