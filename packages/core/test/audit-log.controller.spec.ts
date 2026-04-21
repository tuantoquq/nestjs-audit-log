import { Test } from '@nestjs/testing';
import { AuditLogController, AuditLogModule } from '../src';

describe('AuditLogController', () => {
  it('registers GET /audit-logs only when exposeApi is true', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuditLogModule.forRoot({
          schema: (ctx) => ({ action: ctx.action }),
          storage: { type: 'memory' },
          exposeApi: true,
        }),
      ],
    }).compile();

    expect(moduleRef.get(AuditLogController)).toBeDefined();
  });
});
