# @nestjs-audit-log/prisma

Prisma storage adapter for [`@nestjs-audit-log/core`](https://www.npmjs.com/package/@nestjs-audit-log/core).

## Install

```bash
pnpm add @nestjs-audit-log/core @nestjs-audit-log/prisma @prisma/client
pnpm add -D prisma
```

Run Prisma client generation after adding or changing your Prisma schema:

```bash
pnpm prisma generate
```

## Use

```ts
import { AuditLogModule, defineAuditSchema } from '@nestjs-audit-log/core';
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

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
  storage: new PrismaAuditAdapter(prisma.auditLog),
});
```

## Default Model Shape

Default copy-paste setup:

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  timestamp  DateTime
  action     String
  resource   String
  resourceId String?
  actorId    String?
  diff       Json?
}
```

```ts
const schema = defineAuditSchema((ctx) => ({
  timestamp: ctx.timestamp,
  action: ctx.action,
  resource: ctx.resource,
  resourceId: ctx.resourceId,
  actorId: ctx.actor.sub as string | undefined,
  diff: ctx.diff,
}));
```

## Custom Model Shape

The Prisma delegate receives exactly the object returned by `defineAuditSchema(...)` as
`create({ data })`.

If your schema uses product-specific field names, keep the Prisma model aligned with that shape and
map query filters when needed:

```ts
const schema = defineAuditSchema((ctx) => ({
  eventName: ctx.action,
  subjectType: ctx.resource,
  subjectId: ctx.resourceId,
  userId: ctx.actor.sub,
  changedAt: ctx.timestamp,
}));

AuditLogModule.forRoot({
  schema,
  storage: new PrismaAuditAdapter(prisma.auditEvent, (filters) => ({
    eventName: filters.action,
    subjectType: filters.resource,
    subjectId: filters.resourceId,
    userId: filters.actorId,
  })),
});
```
