import { Test } from '@nestjs/testing';
import { AuditLogModule, AuditLogService, InMemoryAuditAdapter } from '../src';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let storage: InMemoryAuditAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuditLogModule.forRoot({
          schema: (ctx) => ({
            action: ctx.action,
            actorId: ctx.actor.id as string,
          }),
          storage: { type: 'memory' },
          async: false,
        }),
      ],
    }).compile();

    service = moduleRef.get(AuditLogService);
    storage = moduleRef.get(InMemoryAuditAdapter);
  });

  it('logs a manual entry through the configured schema and storage', async () => {
    await service.log({
      action: 'CANCEL',
      resource: 'Order',
      resourceId: 'order-1',
      actor: { id: 'actor-1' },
    });

    expect(storage.records).toEqual([{ action: 'CANCEL', actorId: 'actor-1' }]);
  });

  it('returns filtered results from memory storage', async () => {
    await storage.save({
      action: 'UPDATE',
      resource: 'User',
      resourceId: '1',
      actorId: 'a',
    });
    await storage.save({
      action: 'DELETE',
      resource: 'User',
      resourceId: '2',
      actorId: 'a',
    });

    await expect(service.query({ action: 'UPDATE', limit: 10, offset: 0 })).resolves.toEqual({
      items: [{ action: 'UPDATE', resource: 'User', resourceId: '1', actorId: 'a' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });
});
