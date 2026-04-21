import { AuditLogModule } from '@nestjs-audit-log/core';
import { PrismaAuditAdapter, PrismaAuditDelegate } from '../src';

type AuditRecord = {
  action: string;
  actorId: string;
};

class FakePrismaAuditDelegate implements PrismaAuditDelegate<AuditRecord> {
  readonly records: AuditRecord[] = [];

  create(args: { data: AuditRecord }): Promise<AuditRecord> {
    this.records.push(args.data);
    return Promise.resolve(args.data);
  }

  findMany(): Promise<AuditRecord[]> {
    return Promise.resolve(this.records);
  }

  count(): Promise<number> {
    return Promise.resolve(this.records.length);
  }
}

describe('Prisma package integration', () => {
  it('can be passed to AuditLogModule as a storage adapter instance', () => {
    const model = new FakePrismaAuditDelegate();
    const moduleDefinition = AuditLogModule.forRoot({
      schema: (ctx: { action: string; actor: Record<string, unknown> }) => ({
        action: ctx.action,
        actorId: typeof ctx.actor.id === 'string' ? ctx.actor.id : '',
      }),
      storage: new PrismaAuditAdapter(model),
    });

    expect(moduleDefinition.module).toBe(AuditLogModule);
    expect(moduleDefinition.providers).toBeDefined();
  });
});
