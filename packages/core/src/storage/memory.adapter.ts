import { Injectable } from '@nestjs/common';
import { AuditQueryFilters, AuditStorageAdapter, PaginatedResult } from './storage.adapter';

@Injectable()
export class InMemoryAuditAdapter<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> implements AuditStorageAdapter<TRecord> {
  readonly records: TRecord[] = [];

  save(record: TRecord): Promise<void> {
    this.records.push(record);
    return Promise.resolve();
  }

  query(filters: AuditQueryFilters): Promise<PaginatedResult<TRecord>> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    const filtered = this.records.filter((record) => matchesFilter(record, filters));
    const items = filtered.slice(offset, offset + limit);
    return Promise.resolve({ items, total: filtered.length, limit, offset });
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

function matchesFilter(record: Record<string, unknown>, filters: AuditQueryFilters): boolean {
  return (
    (!filters.action || record.action === filters.action) &&
    (!filters.resource || record.resource === filters.resource) &&
    (!filters.resourceId || record.resourceId === filters.resourceId) &&
    (!filters.actorId || record.actorId === filters.actorId)
  );
}
