import { Test } from '@nestjs/testing';
import { AuditLogTestingModule, MockAuditService } from '../src';
import packageJson from '../package.json';

describe('AuditLogTestingModule', () => {
  it('publishes under the scoped package family', () => {
    expect(packageJson.name).toBe('@nestjs-audit-log/testing');
  });

  it('provides a mock audit service that records manual logs', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditLogTestingModule],
    }).compile();

    const service = moduleRef.get(MockAuditService);
    await service.log({ action: 'CREATE', resource: 'User', resourceId: '1' });

    expect(service.entries).toEqual([{ action: 'CREATE', resource: 'User', resourceId: '1' }]);
  });
});
