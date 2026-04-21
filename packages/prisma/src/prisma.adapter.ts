import { AuditQueryFilters, AuditStorageAdapter, PaginatedResult } from '@nestjs-audit-log/core';

export type PrismaQueryMapper<TWhere extends Record<string, unknown> = Record<string, unknown>> = (
  filters: AuditQueryFilters,
) => TWhere;

export interface PrismaAuditDelegate<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
  TWhere extends Record<string, unknown> = Record<string, unknown>,
> {
  create(args: { data: TRecord }): Promise<unknown>;
  findMany(args: { where: TWhere; take: number; skip: number }): Promise<TRecord[]>;
  count(args: { where: TWhere }): Promise<number>;
}

export class PrismaAuditAdapter<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
  TWhere extends Record<string, unknown> = Record<string, unknown>,
> implements AuditStorageAdapter<TRecord> {
  constructor(
    private readonly model: PrismaAuditDelegate<TRecord, TWhere>,
    private readonly mapQueryFilters: PrismaQueryMapper<TWhere> = defaultMapQueryFilters as PrismaQueryMapper<TWhere>,
  ) {}

  async save(record: TRecord): Promise<void> {
    await this.model.create({ data: record });
  }

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<TRecord>> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    const where = this.mapQueryFilters(filters);
    const [items, total] = await Promise.all([
      this.model.findMany({ where, take: limit, skip: offset }),
      this.model.count({ where }),
    ]);

    return { items, total, limit, offset };
  }
}

function defaultMapQueryFilters(filters: AuditQueryFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.resource) {
    where.resource = filters.resource;
  }
  if (filters.resourceId) {
    where.resourceId = filters.resourceId;
  }
  if (filters.actorId) {
    where.actorId = filters.actorId;
  }
  return where;
}
