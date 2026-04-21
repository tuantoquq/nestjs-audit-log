import { PrismaAuditAdapter, PrismaAuditDelegate } from '../src';

type AuditRecord = {
  action: string;
  resource: string;
  resourceId: string;
  actorId: string;
  diff?: unknown;
};

type PrismaFindArgs = {
  where: Record<string, unknown>;
  take: number;
  skip: number;
};

class FakePrismaAuditDelegate implements PrismaAuditDelegate<AuditRecord> {
  readonly records: AuditRecord[] = [];
  readonly createCalls: Array<{ data: AuditRecord }> = [];
  readonly findManyCalls: PrismaFindArgs[] = [];
  readonly countCalls: Array<{ where: Record<string, unknown> }> = [];

  create(args: { data: AuditRecord }): Promise<AuditRecord> {
    this.createCalls.push(args);
    this.records.push(args.data);
    return Promise.resolve(args.data);
  }

  findMany(args: PrismaFindArgs): Promise<AuditRecord[]> {
    this.findManyCalls.push(args);
    return Promise.resolve(
      this.records
        .filter((record) => matchesWhere(record, args.where))
        .slice(args.skip, args.skip + args.take),
    );
  }

  count(args: { where: Record<string, unknown> }): Promise<number> {
    this.countCalls.push(args);
    return Promise.resolve(
      this.records.filter((record) => matchesWhere(record, args.where)).length,
    );
  }
}

describe('PrismaAuditAdapter', () => {
  it('saves records through a Prisma model delegate', async () => {
    const delegate = new FakePrismaAuditDelegate();
    const adapter = new PrismaAuditAdapter(delegate);

    await adapter.save({
      action: 'UPDATE',
      resource: 'User',
      resourceId: 'user-1',
      actorId: 'actor-1',
      diff: { email: { from: 'old@example.com', to: 'new@example.com' } },
    });

    expect(delegate.createCalls).toEqual([
      {
        data: {
          action: 'UPDATE',
          resource: 'User',
          resourceId: 'user-1',
          actorId: 'actor-1',
          diff: { email: { from: 'old@example.com', to: 'new@example.com' } },
        },
      },
    ]);
    expect(delegate.records).toHaveLength(1);
  });

  it('queries records with default audit fields and pagination', async () => {
    const delegate = new FakePrismaAuditDelegate();
    const adapter = new PrismaAuditAdapter(delegate);

    await adapter.save({
      action: 'UPDATE',
      resource: 'User',
      resourceId: 'user-1',
      actorId: 'actor-1',
    });
    await adapter.save({
      action: 'DELETE',
      resource: 'User',
      resourceId: 'user-2',
      actorId: 'actor-1',
    });

    await expect(adapter.query({ action: 'UPDATE', limit: 10, offset: 0 })).resolves.toEqual({
      items: [
        {
          action: 'UPDATE',
          resource: 'User',
          resourceId: 'user-1',
          actorId: 'actor-1',
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
    });

    expect(delegate.findManyCalls).toEqual([
      {
        where: { action: 'UPDATE' },
        take: 10,
        skip: 0,
      },
    ]);
    expect(delegate.countCalls).toEqual([{ where: { action: 'UPDATE' } }]);
  });

  it('uses custom query filter mapping for user-defined Prisma model fields', async () => {
    const delegate = new FakePrismaAuditDelegate();
    const adapter = new PrismaAuditAdapter(delegate, (filters) => ({
      eventName: filters.action,
      subjectType: filters.resource,
      subjectId: filters.resourceId,
      userId: filters.actorId,
    }));

    await adapter.query({
      action: 'USER_UPDATED',
      resource: 'users',
      resourceId: 'user-1',
      actorId: 'actor-1',
    });

    expect(delegate.findManyCalls).toEqual([
      {
        where: {
          eventName: 'USER_UPDATED',
          subjectType: 'users',
          subjectId: 'user-1',
          userId: 'actor-1',
        },
        take: 50,
        skip: 0,
      },
    ]);
  });
});

function matchesWhere(record: AuditRecord, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => record[key as keyof AuditRecord] === value);
}
