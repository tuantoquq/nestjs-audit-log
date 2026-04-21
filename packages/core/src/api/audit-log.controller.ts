import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from '../audit-log.service';
import { AuditLogQueryDto } from './audit-log-query.dto';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  query(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.query({
      ...query,
      limit: query.limit ? Number(query.limit) : 50,
      offset: query.offset ? Number(query.offset) : 0,
    });
  }
}
