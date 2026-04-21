import { AuditQueryFilters, AuditStorageAdapter, PaginatedResult } from './storage.adapter';

export interface BufferedAuditAdapterOptions {
  batchSize?: number;
  flushIntervalMs?: number;
}

export class BufferedAuditAdapter<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> implements AuditStorageAdapter<TRecord> {
  private readonly batchSize: number;
  private readonly queue: TRecord[] = [];
  private readonly interval: NodeJS.Timeout | undefined;

  constructor(
    private readonly inner: AuditStorageAdapter<TRecord>,
    options: BufferedAuditAdapterOptions = {},
  ) {
    this.batchSize = options.batchSize ?? 100;
    const flushIntervalMs = options.flushIntervalMs ?? 1000;
    this.interval =
      flushIntervalMs > 0
        ? setInterval(() => {
            void this.flush();
          }, flushIntervalMs)
        : undefined;
    this.interval?.unref?.();
  }

  async save(record: TRecord): Promise<void> {
    this.queue.push(record);
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<TRecord>> {
    if (!this.inner.query) {
      return {
        items: [],
        total: 0,
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
      };
    }
    return this.inner.query(filters);
  }

  async flush(): Promise<void> {
    const records = this.queue.splice(0, this.queue.length);
    for (const record of records) {
      await this.inner.save(record);
    }
  }

  close(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
