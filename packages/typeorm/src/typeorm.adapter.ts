import type {
  DataSource,
  DeepPartial,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { AuditQueryFilters, AuditStorageAdapter, PaginatedResult } from '@nestjs-audit-log/core';

export class TypeOrmAuditAdapter<
  TEntity extends ObjectLiteral = ObjectLiteral,
> implements AuditStorageAdapter<DeepPartial<TEntity>> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly entity: EntityTarget<TEntity>,
  ) {}

  async save(record: DeepPartial<TEntity>): Promise<void> {
    await this.dataSource.getRepository(this.entity).save(record);
  }

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<DeepPartial<TEntity>>> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    const where = buildWhere<TEntity>(filters);
    const [items, total] = await this.dataSource.getRepository(this.entity).findAndCount({
      where,
      take: limit,
      skip: offset,
    });

    return { items, total, limit, offset };
  }
}

function buildWhere<TEntity extends ObjectLiteral>(
  filters: AuditQueryFilters,
): FindOptionsWhere<TEntity> {
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
  return where as FindOptionsWhere<TEntity>;
}
