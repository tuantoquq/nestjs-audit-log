import type { AuditQueryFilters, ManualAuditEntry, PaginatedResult } from '@nestjs-audit-log/core';

export class MockAuditService {
  readonly entries: ManualAuditEntry[] = [];

  log(entry: ManualAuditEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  query(filters: AuditQueryFilters): Promise<PaginatedResult<ManualAuditEntry>> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    const items = this.entries
      .filter((entry) => matchesFilter(entry, filters))
      .slice(offset, offset + limit);
    return Promise.resolve({ items, total: items.length, limit, offset });
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }

  reset(): void {
    this.entries.splice(0, this.entries.length);
  }
}

function matchesFilter(entry: ManualAuditEntry, filters: AuditQueryFilters): boolean {
  const actionMatches = !filters.action || entry.action === filters.action;
  const resourceMatches = !filters.resource || entry.resource === filters.resource;
  const resourceIdMatches = !filters.resourceId || entry.resourceId === filters.resourceId;
  return actionMatches && resourceMatches && resourceIdMatches;
}
