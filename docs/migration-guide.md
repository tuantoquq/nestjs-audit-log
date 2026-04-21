# Migration Guide

Move manual audit writes into `AuditLogService` first, then move fixed columns into a
`defineAuditSchema(...)` factory so controllers and services stop shaping persistence records by
hand.

## Replace Manual Repository Writes

Before:

```ts
await this.auditLogsRepository.save({
  timestamp: new Date(),
  actorId: user.id,
  action: 'UPDATE',
  resource: 'User',
  resourceId: user.id,
  before: previousUser,
  after: updatedUser,
});
```

After:

```ts
await this.auditLog.log({
  action: 'UPDATE',
  resource: 'User',
  resourceId: user.id,
  actor: { sub: user.id, email: user.email },
  before: previousUser,
  after: updatedUser,
});
```

## Move Fixed Columns Into A Schema Factory

Before:

```ts
await this.auditLogsRepository.save({
  createdAt: new Date(),
  userId: request.user.id,
  eventName: 'USER_UPDATED',
  tableName: 'users',
  rowId: id,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  payload: diff,
});
```

After:

```ts
const schema = defineAuditSchema((ctx) => ({
  createdAt: ctx.timestamp,
  userId: ctx.actor.sub as string,
  eventName: ctx.action,
  tableName: ctx.resource,
  rowId: ctx.resourceId,
  ipAddress: ctx.request.ip,
  userAgent: ctx.request.headers['user-agent'],
  payload: ctx.diff,
}));
```

Register the storage adapter once:

```ts
import { TypeOrmAuditAdapter } from '@nestjs-audit-log/typeorm';

AuditLogModule.forRoot({
  schema,
  storage: new TypeOrmAuditAdapter(dataSource, AuditLogEntity),
  actor: { resolver: 'jwt', jwtField: 'user' },
});
```

Then decorate controller methods:

```ts
@AuditLog({ action: 'USER_UPDATED', resource: 'users', resourceId: (ctx) => ctx.request.params.id })
@Patch(':id')
updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.users.update(id, dto);
}
```

## Split Adapter Packages

Before:

```ts
AuditLogModule.forRoot({
  schema,
  storage: { type: 'prisma', model: prisma.auditLog },
});
```

After:

```ts
import { PrismaAuditAdapter } from '@nestjs-audit-log/prisma';

AuditLogModule.forRoot({
  schema,
  storage: new PrismaAuditAdapter(prisma.auditLog),
});
```

Apply the same pattern for TypeORM and Mongoose by installing the matching
`@nestjs-audit-log/*` package and passing the adapter instance to `storage`.

## Remove `nestjs-cls`

Previous versions of the core package required `nestjs-cls` for actor propagation between the
middleware and interceptor.

After upgrading:

```bash
pnpm remove nestjs-cls
pnpm add @nestjs-audit-log/core
```

The core package now attaches the resolved actor directly to the request object. No extra context
library is required for the built-in `console` or `memory` storage paths.
