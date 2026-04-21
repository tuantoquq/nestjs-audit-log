import 'reflect-metadata';
import { AuditLogMetadata } from '../src';
import { AUDIT_LOG_METADATA } from '../src/audit-log.constants';
import { AuditLog } from '../src';

describe('@AuditLog', () => {
  it('stores audit metadata on a method', () => {
    class UsersController {
      @AuditLog({
        action: 'UPDATE',
        resource: 'User',
        resourceId: (ctx) => ctx.request.params.id,
      })
      update() {
        return undefined;
      }
    }

    const target = Object.getOwnPropertyDescriptor(UsersController.prototype, 'update')?.value as
      | object
      | undefined;
    if (!target) {
      throw new Error('Expected update method metadata target');
    }

    const rawMetadata: unknown = Reflect.getMetadata(AUDIT_LOG_METADATA, target);
    const metadata = rawMetadata as AuditLogMetadata;

    expect(metadata.action).toBe('UPDATE');
    expect(metadata.resource).toBe('User');
    if (typeof metadata.resourceId !== 'function') {
      throw new Error('Expected resourceId to be a function');
    }
    expect(
      metadata.resourceId({
        request: {
          ip: '127.0.0.1',
          method: 'PATCH',
          path: '/users/123',
          params: { id: '123' },
          query: {},
          headers: {},
        },
        actor: {},
        action: 'UPDATE',
        resource: 'User',
        resourceId: undefined,
        body: undefined,
        before: undefined,
        after: undefined,
        diff: undefined,
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
        traceId: undefined,
        error: undefined,
      }),
    ).toBe('123');
  });
});
