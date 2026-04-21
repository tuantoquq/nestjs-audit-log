import { Module, type Provider } from '@nestjs/common';
import { MockAuditService } from './mock-audit.service';

const AUDIT_LOG_SERVICE_TOKEN = 'AuditLogService';

const auditLogServiceProvider: Provider = {
  provide: AUDIT_LOG_SERVICE_TOKEN,
  useExisting: MockAuditService,
};

@Module({
  providers: [MockAuditService, auditLogServiceProvider],
  exports: [MockAuditService, AUDIT_LOG_SERVICE_TOKEN],
})
export class AuditLogTestingModule {}
