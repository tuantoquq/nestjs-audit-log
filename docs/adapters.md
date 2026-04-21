# Storage Adapters

`AuditStorageAdapter` persists the record returned by your `defineAuditSchema(...)` factory.
`@nestjs-audit-log/core` includes only the built-in `console` and `memory` adapters. Install a
dedicated `@nestjs-audit-log/*` package for TypeORM, Mongoose, or Prisma persistence.

## Schema Compatibility

The adapter layer does not transform your audit record into a fixed storage contract. The object
returned by `defineAuditSchema(...)` is the object written to storage.

That means you can use either:

- a default audit shape such as `action`, `resource`, `resourceId`, `actorId`, `timestamp`
- a custom product shape such as `eventName`, `subjectType`, `subjectId`, `actorEmail`,
  `changedAt`

The only rule is that your storage model must accept the schema output.

## Actor Configuration

The most common actor config is:

```ts
actor: { resolver: 'jwt', jwtField: 'user' }
```

That reads the actor record from `request.user`.

Other supported forms:

```ts
actor: { resolver: 'session' } // reads request.session.user
actor: { resolver: 'header', headerName: 'x-user-id' } // returns { id: headerValue }
actor: { resolver: async (request) => ({ sub: String(request.accountId) }) }
```

## Console

Use console storage for local development and smoke tests.

```ts
AuditLogModule.forRoot({
  schema,
  storage: { type: 'console' },
  async: true,
});
```

## Memory

Use memory storage for tests or short-lived demos. Records are lost when the process exits.

```ts
AuditLogModule.forRoot({
  schema,
  storage: { type: 'memory' },
  exposeApi: true,
});
```

## TypeORM

Use TypeORM storage when audit records should be saved through a TypeORM repository. The entity
shape should match the object returned by your schema factory.

```ts
import { AuditLogModule } from '@nestjs-audit-log/core';
import { TypeOrmAuditAdapter } from '@nestjs-audit-log/typeorm';

AuditLogModule.forRoot({
  schema,
  storage: new TypeOrmAuditAdapter(dataSource, AuditLogEntity),
  async: true,
  logErrors: true,
});
```

Default-style entity fields work well when your schema returns keys like `action`, `resource`,
`resourceId`, and `actorId`. A custom entity works as well, as long as its columns match your
custom schema output.

## Mongoose

Use Mongoose storage when audit records should be saved through a Mongoose model. The schema can
store any custom fields returned by your schema factory.

```ts
import { AuditLogModule } from '@nestjs-audit-log/core';
import { MongooseAuditAdapter } from '@nestjs-audit-log/mongoose';

AuditLogModule.forRoot({
  schema,
  storage: new MongooseAuditAdapter(AuditLogModel),
  actor: { resolver: 'header', headerName: 'x-user-id' },
  mask: ['before.password', 'after.password'],
});
```

This adapter is a good fit when you want a flexible document shape. A custom Mongoose schema can
store product-specific fields returned by `defineAuditSchema(...)` without forcing a generic audit
table layout.

## Prisma

Use Prisma storage when audit records should be saved through a Prisma model delegate. The Prisma
model should accept the object returned by your schema factory as `create({ data })` input.

```ts
import { AuditLogModule } from '@nestjs-audit-log/core';
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

AuditLogModule.forRoot({
  schema,
  storage: new PrismaAuditAdapter(prisma.auditLog),
  async: true,
  logErrors: true,
});
```

The default query mapper uses `action`, `resource`, `resourceId`, and `actorId` fields. Use
`mapQueryFilters` when your Prisma model uses product-specific column names.

```ts
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

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

That pattern is the Prisma equivalent of a custom schema: write whatever fields your model expects,
then translate the built-in query filters to those field names.

## Buffered Writes

Any built-in adapter can be wrapped with the in-process buffer.

```ts
import { TypeOrmAuditAdapter } from '@nestjs-audit-log/typeorm';

AuditLogModule.forRoot({
  schema,
  storage: new TypeOrmAuditAdapter(dataSource, AuditLogEntity),
  buffer: {
    enabled: true,
    batchSize: 100,
    flushIntervalMs: 1000,
  },
});
```

Flush the service before application shutdown when buffered writes are enabled.

```ts
await app.get(AuditLogService).flush();
```
