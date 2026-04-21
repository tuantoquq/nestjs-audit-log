export class AuditLogQueryDto {
  action?: string;
  resource?: string;
  resourceId?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}
