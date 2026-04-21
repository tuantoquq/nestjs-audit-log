import { AuditContext } from './audit-context';

export type AuditSchemaFactory<
  TRecord extends Record<string, unknown>,
  TBody = unknown,
  TBefore = unknown,
  TAfter = unknown,
> = (context: AuditContext<TBody, TBefore, TAfter>) => TRecord;

export function defineAuditSchema<
  TRecord extends Record<string, unknown>,
  TBody = unknown,
  TBefore = unknown,
  TAfter = unknown,
>(
  factory: AuditSchemaFactory<TRecord, TBody, TBefore, TAfter>,
): AuditSchemaFactory<TRecord, TBody, TBefore, TAfter> {
  return factory;
}
