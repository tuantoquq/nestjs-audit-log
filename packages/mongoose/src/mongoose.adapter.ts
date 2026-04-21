import type { Model } from 'mongoose';
import { AuditQueryFilters, AuditStorageAdapter, PaginatedResult } from '@nestjs-audit-log/core';

export class MongooseAuditAdapter<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> implements AuditStorageAdapter<Partial<TRecord>> {
  constructor(private readonly model: Model<TRecord>) {}

  async save(record: Partial<TRecord>): Promise<void> {
    await this.model.create(record);
  }

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<Partial<TRecord>>> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      this.model.find(where).skip(offset).limit(limit).lean<Partial<TRecord>[]>().exec(),
      this.model.countDocuments(where).exec(),
    ]);

    return { items, total, limit, offset };
  }
}

function buildWhere(filters: AuditQueryFilters): Record<string, unknown> {
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
