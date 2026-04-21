import { BufferedAuditAdapter, InMemoryAuditAdapter } from '../src';

describe('BufferedAuditAdapter', () => {
  it('flushes when batch size is reached', async () => {
    const inner = new InMemoryAuditAdapter();
    const adapter = new BufferedAuditAdapter(inner, {
      batchSize: 2,
      flushIntervalMs: 60000,
    });

    await adapter.save({ action: 'A' });
    expect(inner.records).toEqual([]);

    await adapter.save({ action: 'B' });
    expect(inner.records).toEqual([{ action: 'A' }, { action: 'B' }]);

    await adapter.flush();
  });
});
