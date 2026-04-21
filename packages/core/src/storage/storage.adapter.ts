export interface AuditQueryFilters {
  action?: string;
  resource?: string;
  resourceId?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<TRecord = Record<string, unknown>> {
  items: TRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditStorageAdapter<TRecord = Record<string, unknown>> {
  save(record: TRecord): Promise<void>;
  query?(filters: AuditQueryFilters): Promise<PaginatedResult<TRecord>>;
  flush?(): Promise<void>;
}
