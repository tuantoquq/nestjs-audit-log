import { SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AUDIT_LOG_METADATA } from './audit-log.constants';
import { AuditContext } from './schema/audit-context';

export interface AuditLogMetadata<TBefore = unknown, TAfter = unknown> {
  action: string;
  resource: string;
  resourceId?: string | ((context: AuditContext) => string | undefined);
  beforeFn?: (context: AuditContext, services: ModuleRef) => Promise<TBefore> | TBefore;
  afterFn?: (context: AuditContext, services: ModuleRef) => Promise<TAfter> | TAfter;
  mask?: string[];
  skip?: (context: AuditContext) => boolean | Promise<boolean>;
}

export function AuditLog(metadata: AuditLogMetadata): MethodDecorator & ClassDecorator {
  return SetMetadata(AUDIT_LOG_METADATA, metadata);
}
