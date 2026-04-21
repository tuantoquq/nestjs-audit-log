# @nestjs-audit-log/typeorm

TypeORM storage adapter for [`@nestjs-audit-log/core`](https://www.npmjs.com/package/@nestjs-audit-log/core).

## Install

```bash
pnpm add @nestjs-audit-log/core @nestjs-audit-log/typeorm @nestjs/typeorm typeorm pg
```

## Use

```ts
import { AuditLogModule, defineAuditSchema } from '@nestjs-audit-log/core';
import { TypeOrmAuditAdapter } from '@nestjs-audit-log/typeorm';

const schema = defineAuditSchema((ctx) => ({
  timestamp: ctx.timestamp,
  action: ctx.action,
  resource: ctx.resource,
  resourceId: ctx.resourceId,
  actorId: ctx.actor.sub as string | undefined,
  diff: ctx.diff,
}));

AuditLogModule.forRoot({
  schema,
  storage: new TypeOrmAuditAdapter(dataSource, AuditLogEntity),
});
```

## Entity Shape

The entity should match the object returned by `defineAuditSchema(...)`.

Default copy-paste setup:

```ts
const schema = defineAuditSchema((ctx) => ({
  timestamp: ctx.timestamp,
  action: ctx.action,
  resource: ctx.resource,
  resourceId: ctx.resourceId,
  actorId: ctx.actor.sub as string | undefined,
  diff: ctx.diff,
}));

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  timestamp!: Date;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ nullable: true })
  actorId?: string;

  @Column({ type: 'json', nullable: true })
  diff?: Record<string, unknown>;
}
```

Custom entity shapes also work, as long as the schema output matches the entity columns.
