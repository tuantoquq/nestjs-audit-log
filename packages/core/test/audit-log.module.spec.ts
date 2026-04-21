import {
  AuditLogModule,
  AuditQueryFilters,
  AuditStorageAdapter,
  ConsoleAuditAdapter,
  InMemoryAuditAdapter,
  PaginatedResult,
} from '../src';

type AuditRecord = {
  action: string;
  actorId?: string;
};

class FakeAuditAdapter implements AuditStorageAdapter<AuditRecord> {
  readonly records: AuditRecord[] = [];

  save(record: AuditRecord): Promise<void> {
    this.records.push(record);
    return Promise.resolve();
  }

  query(filters: AuditQueryFilters): Promise<PaginatedResult<AuditRecord>> {
    const items = filters.action
      ? this.records.filter((record) => record.action === filters.action)
      : this.records;

    return Promise.resolve({
      items,
      total: items.length,
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
    });
  }
}

describe('AuditLogModule', () => {
  it('boots with forRoot()', () => {
    const moduleDefinition = AuditLogModule.forRoot({
      schema: (ctx) => ({ timestamp: ctx.timestamp, action: ctx.action }),
      storage: { type: 'console' },
    });

    expect(moduleDefinition.module).toBe(AuditLogModule);
    expect(moduleDefinition.providers).toBeDefined();
  });

  it('boots with forRootAsync()', () => {
    const moduleDefinition = AuditLogModule.forRootAsync({
      useFactory: () => ({
        schema: (ctx) => ({ action: ctx.action }),
        storage: { type: 'memory' },
      }),
    });

    expect(moduleDefinition.module).toBe(AuditLogModule);
    expect(moduleDefinition.providers).toBeDefined();
  });

  it('resolves console storage through the built-in console adapter', () => {
    const resolved = (
      AuditLogModule as unknown as {
        resolveStorageAdapter: (
          options: { storage: { type: 'console' } },
          consoleAdapter: ConsoleAuditAdapter,
          memoryAdapter: InMemoryAuditAdapter,
        ) => AuditStorageAdapter<AuditRecord>;
      }
    ).resolveStorageAdapter(
      { storage: { type: 'console' } },
      new ConsoleAuditAdapter(),
      new InMemoryAuditAdapter(),
    );

    expect(resolved).toBeInstanceOf(ConsoleAuditAdapter);
  });

  it('resolves memory storage through the built-in memory adapter', () => {
    const memoryAdapter = new InMemoryAuditAdapter();
    const resolved = (
      AuditLogModule as unknown as {
        resolveStorageAdapter: (
          options: { storage: { type: 'memory' } },
          consoleAdapter: ConsoleAuditAdapter,
          memoryAdapter: InMemoryAuditAdapter,
        ) => AuditStorageAdapter<AuditRecord>;
      }
    ).resolveStorageAdapter(
      { storage: { type: 'memory' } },
      new ConsoleAuditAdapter(),
      memoryAdapter,
    );

    expect(resolved).toBe(memoryAdapter);
  });

  it('resolves a custom adapter instance unchanged', () => {
    const adapter = new FakeAuditAdapter();
    const resolved = (
      AuditLogModule as unknown as {
        resolveStorageAdapter: (
          options: { storage: AuditStorageAdapter<AuditRecord> },
          consoleAdapter: ConsoleAuditAdapter,
          memoryAdapter: InMemoryAuditAdapter,
        ) => AuditStorageAdapter<AuditRecord>;
      }
    ).resolveStorageAdapter(
      { storage: adapter },
      new ConsoleAuditAdapter(),
      new InMemoryAuditAdapter(),
    );

    expect(resolved).toBe(adapter);
  });
});
