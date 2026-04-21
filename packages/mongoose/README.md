# @nestjs-audit-log/mongoose

Mongoose storage adapter for [`@nestjs-audit-log/core`](https://www.npmjs.com/package/@nestjs-audit-log/core).

## Install

```bash
pnpm add @nestjs-audit-log/core @nestjs-audit-log/mongoose @nestjs/mongoose mongoose
```

## Use

```ts
import { AuditLogModule, defineAuditSchema } from '@nestjs-audit-log/core';
import { MongooseAuditAdapter } from '@nestjs-audit-log/mongoose';

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
  storage: new MongooseAuditAdapter(auditLogModel),
});
```

## Model Shape

The Mongoose model should accept the object returned by `defineAuditSchema(...)`.

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

const AuditLogSchema = new Schema({
  timestamp: Date,
  action: String,
  resource: String,
  resourceId: String,
  actorId: String,
  diff: Schema.Types.Mixed,
});
```

Custom document shapes work the same way:

```ts
const AuditEventSchema = new Schema({
  eventName: String,
  subjectType: String,
  subjectId: String,
  actorEmail: String,
  changedAt: Date,
});
```
