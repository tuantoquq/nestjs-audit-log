# NestJS Audit Log

Decorator-based audit logging for NestJS with user-defined audit record schemas.

## Packages

- `@nestjs-audit-log/core`
- `@nestjs-audit-log/typeorm`
- `@nestjs-audit-log/mongoose`
- `@nestjs-audit-log/prisma`
- `@nestjs-audit-log/testing`

## Install

```bash
pnpm add @nestjs-audit-log/core
```

`@nestjs-audit-log/core` includes only the built-in `console` and `memory` storage types.
Install one adapter package when audit records should be written to a database.

```bash
pnpm add @nestjs-audit-log/typeorm @nestjs/typeorm typeorm pg
pnpm add @nestjs-audit-log/mongoose @nestjs/mongoose mongoose
pnpm add @nestjs-audit-log/prisma @prisma/client
pnpm add -D prisma
```

Run Prisma generation after adding or changing your Prisma schema:

```bash
pnpm prisma generate
```

## Quick Start

```ts
import { defineAuditSchema } from '@nestjs-audit-log/core';

const schema = defineAuditSchema((ctx) => ({
  timestamp: ctx.timestamp,
  actorId: ctx.actor.sub as string,
  action: ctx.action,
  resource: ctx.resource,
  resourceId: ctx.resourceId,
  diff: ctx.diff,
}));
```

## Register

```ts
import { AuditLogModule } from '@nestjs-audit-log/core';
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

AuditLogModule.forRoot({
  schema,
  actor: { resolver: 'jwt', jwtField: 'user' },
  storage: new PrismaAuditAdapter(prisma.auditLog),
  mask: ['password', 'ssn'],
  async: true,
  logErrors: true,
});
```

`actor: { resolver: 'jwt', jwtField: 'user' }` means "read the actor object from `request.user`".
That matches the default NestJS authentication flow used by Passport and many JWT guards.

For local development, smoke tests, or when persistence is not needed yet, `console` storage stays
built in to the core package:

```ts
AuditLogModule.forRoot({
  schema,
  storage: { type: 'console' },
});
```

## Actor Resolution

The library resolves an actor record before each audit entry is created.

### JWT Resolver

Use the JWT resolver when your auth guard attaches a decoded user object to the request.

```ts
AuditLogModule.forRoot({
  schema,
  actor: { resolver: 'jwt', jwtField: 'user' },
  storage: { type: 'console' },
});
```

If your guard writes to a different field such as `request.auth`, change `jwtField`:

```ts
actor: { resolver: 'jwt', jwtField: 'auth' }
```

### Session Resolver

Use the session resolver when the actor lives at `request.session.user`.

```ts
AuditLogModule.forRoot({
  schema,
  actor: { resolver: 'session' },
  storage: { type: 'console' },
});
```

### Header Resolver

Use the header resolver when upstream infrastructure sends the actor identity through a header.

```ts
AuditLogModule.forRoot({
  schema,
  actor: { resolver: 'header', headerName: 'x-user-id' },
  storage: { type: 'console' },
});
```

The header resolver returns `{ id: <header-value> }`.

### Custom Resolver

Use a custom resolver when the actor shape comes from product-specific request state.

```ts
AuditLogModule.forRoot({
  schema,
  actor: {
    resolver: async (request) => {
      const auth = request.auth as { userId: string; email?: string } | undefined;
      return auth ? { sub: auth.userId, email: auth.email } : {};
    },
  },
  storage: { type: 'console' },
});
```

## Use

```ts
import { Body, Param, Patch } from '@nestjs/common';
import { AuditLog } from '@nestjs-audit-log/core';

@AuditLog({ action: 'UPDATE', resource: 'User', resourceId: (ctx) => ctx.request.params.id })
@Patch(':id')
updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.users.update(id, dto);
}
```

## Manual Logs

Use `AuditLogService` when work happens outside a decorated controller method.

```ts
await this.auditLog.log({
  action: 'CREATE',
  resource: 'Invoice',
  resourceId: invoice.id,
  actor: { sub: user.id, email: user.email },
  after: invoice,
});
```

## Default Schema

The library does not force a fixed persistence model. A common default schema looks like this:

```ts
const schema = defineAuditSchema((ctx) => ({
  timestamp: ctx.timestamp,
  actorId: ctx.actor.sub as string | undefined,
  action: ctx.action,
  resource: ctx.resource,
  resourceId: ctx.resourceId,
  before: ctx.before,
  after: ctx.after,
  diff: ctx.diff,
}));
```

This fits well when your storage model uses generic audit fields such as `action`, `resource`,
`resourceId`, and `actorId`.

## Custom Schema

You can also return a product-specific record shape. The storage model only needs to accept the
object returned by `defineAuditSchema(...)`.

```ts
const schema = defineAuditSchema((ctx) => ({
  eventName: ctx.action,
  subjectType: ctx.resource,
  subjectId: ctx.resourceId,
  tenantId: ctx.request.headers['x-tenant-id'],
  actorEmail: ctx.actor.email,
  payload: ctx.after,
  changedAt: ctx.timestamp,
}));
```

That pattern works with all storage adapters:

- TypeORM entity columns should match the returned object
- Mongoose schema fields should match the returned object
- Prisma model fields should match the returned object

## Query API

Enable the built-in read endpoint when you want a simple admin query surface.

```ts
AuditLogModule.forRoot({
  schema,
  storage: { type: 'memory' },
  exposeApi: true,
});
```

The controller serves `GET /audit-logs` with `action`, `resource`, `resourceId`, `actorId`,
`limit`, and `offset` filters when the active storage adapter supports queries.

## Buffered Writes

Wrap supported adapters with a small in-process buffer for batch-style flushing.

```ts
import { TypeOrmAuditAdapter } from '@nestjs-audit-log/typeorm';

AuditLogModule.forRoot({
  schema,
  storage: new TypeOrmAuditAdapter(dataSource, AuditLogEntity),
  buffer: { enabled: true, batchSize: 100, flushIntervalMs: 1000 },
});
```

Call `AuditLogService.flush()` during shutdown hooks when buffered writes are enabled.

## Prisma

Pass a Prisma model delegate such as `prisma.auditLog` to the Prisma storage adapter.

```ts
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

AuditLogModule.forRoot({
  schema,
  storage: new PrismaAuditAdapter(prisma.auditLog),
});
```

For custom model field names, map query filters to your Prisma `where` shape. This is useful when
your custom schema uses fields such as `eventName`, `subjectType`, or `userId` instead of the
default `action`, `resource`, `resourceId`, and `actorId`.

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

## Storage Model Compatibility

Each storage package writes exactly the record returned by your schema factory.

- `@nestjs-audit-log/typeorm`: the entity class should accept the returned record shape
- `@nestjs-audit-log/mongoose`: the Mongoose schema/model should accept the returned record shape
- `@nestjs-audit-log/prisma`: the Prisma delegate should accept the returned record shape as
  `create({ data })`

When the storage model and schema output drift apart, persistence errors are expected.

## Docs

- [Adapter guide](docs/adapters.md)
- [Migration guide](docs/migration-guide.md)
- [Release checklist](docs/release-checklist.md)
