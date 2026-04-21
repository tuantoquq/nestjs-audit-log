# @nestjs-audit-log/core

Decorator-based audit logging for NestJS with user-defined audit record schemas.

## Install

```bash
pnpm add @nestjs-audit-log/core
```

## Built-In Storage

`console` and `memory` storage stay inside the core package:

```ts
AuditLogModule.forRoot({
  schema,
  storage: { type: 'console' },
});
```

## Add A Persistence Adapter

```bash
pnpm add @nestjs-audit-log/typeorm @nestjs/typeorm typeorm pg
pnpm add @nestjs-audit-log/mongoose @nestjs/mongoose mongoose
pnpm add @nestjs-audit-log/prisma @prisma/client
pnpm add -D prisma
```

## Actor Resolution

The default actor config is:

```ts
actor: { resolver: 'jwt', jwtField: 'user' }
```

That means the library reads the actor object from `request.user`.

Other supported resolver modes:

```ts
actor: { resolver: 'session' } // reads request.session.user
actor: { resolver: 'header', headerName: 'x-user-id' } // returns { id: headerValue }
actor: { resolver: async (request) => ({ sub: String(request.accountId) }) }
```

## Schema Shape

`defineAuditSchema(...)` returns the exact record that will be written by the active storage
adapter.

## `defineAuditSchema(ctx)` Context

The schema factory receives a `ctx` object with the full audit event context. You can map any of
these properties into your stored audit record.

### Request Properties

- `ctx.request.ip`: resolved client IP address
- `ctx.request.method`: HTTP method such as `GET`, `POST`, or `PATCH`
- `ctx.request.path`: request path
- `ctx.request.params`: route params object
- `ctx.request.query`: query string object
- `ctx.request.headers`: request headers object

### Actor Properties

- `ctx.actor`: resolved actor record from the configured actor resolver

Common examples:

- `ctx.actor.sub`: user id from JWT-style payloads
- `ctx.actor.email`: actor email when available
- `ctx.actor.role`: role or permission label when available
- `ctx.actor.id`: actor id when using the header resolver

### Audit Metadata

- `ctx.action`: audit action declared by `@AuditLog({ action: ... })`
- `ctx.resource`: resource name declared by `@AuditLog({ resource: ... })`
- `ctx.resourceId`: resolved resource id when configured
- `ctx.timestamp`: `Date` when the audit event was created
- `ctx.traceId`: request trace id when available
- `ctx.error`: thrown error when the audited operation failed

### Data Snapshots

- `ctx.body`: request body captured for the audited operation
- `ctx.before`: state before the operation when available
- `ctx.after`: state after the operation when available
- `ctx.diff`: deep diff between `before` and `after` when both exist

`ctx.diff` uses entries shaped like:

```ts
{
  fieldName: {
    from: 'old value',
    to: 'new value',
    kind: 'E',
  },
}
```

Where `kind` is:

- `'N'`: new value added
- `'D'`: value deleted
- `'E'`: value edited
- `'A'`: array change

Default-style schema:

```ts
const schema = defineAuditSchema((ctx) => ({
  timestamp: ctx.timestamp,
  method: ctx.request.method,
  path: ctx.request.path,
  actorId: ctx.actor.sub,
  actorEmail: ctx.actor.email,
  action: ctx.action,
  resource: ctx.resource,
  resourceId: ctx.resourceId,
  body: ctx.body,
  before: ctx.before,
  after: ctx.after,
  diff: ctx.diff,
  traceId: ctx.traceId,
  errorMessage: ctx.error?.message,
}));
```

Custom schema:

```ts
const schema = defineAuditSchema((ctx) => ({
  eventName: ctx.action,
  subjectType: ctx.resource,
  subjectId: ctx.resourceId,
  actorEmail: ctx.actor.email,
  changedAt: ctx.timestamp,
}));
```

Your TypeORM entity, Mongoose schema, or Prisma model should match the returned object shape.

## Quick Start

```ts
import { AuditLogModule } from '@nestjs-audit-log/core';
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

AuditLogModule.forRoot({
  schema,
  storage: new PrismaAuditAdapter(prisma.auditLog),
});
```
