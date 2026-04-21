import type {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import { AuditSchemaFactory } from './schema/define-schema';
import type { AuditStorageAdapter } from './storage/storage.adapter';

export type BuiltInActorResolver = 'jwt' | 'session' | 'header';

export interface ActorResolverOptions {
  resolver:
    | BuiltInActorResolver
    | ((
        request: Record<string, unknown>,
      ) => Promise<Record<string, unknown>> | Record<string, unknown>);
  jwtField?: string;
  headerName?: string;
}

export interface ConsoleStorageOptions {
  type: 'console';
}

export interface MemoryStorageOptions {
  type: 'memory';
}

export type AuditStorageOptions<TRecord extends Record<string, unknown> = Record<string, unknown>> =
  | ConsoleStorageOptions
  | MemoryStorageOptions
  | AuditStorageAdapter<TRecord>;

export interface BufferOptions {
  enabled: boolean;
  batchSize?: number;
  flushIntervalMs?: number;
}

export interface AuditLogModuleOptions<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> {
  schema: AuditSchemaFactory<TRecord>;
  storage: AuditStorageOptions<TRecord>;
  async?: boolean;
  logErrors?: boolean;
  mask?: string[];
  actor?: ActorResolverOptions;
  buffer?: BufferOptions;
  exposeApi?: boolean;
}

export interface AuditLogModuleAsyncOptions<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> {
  imports?: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: unknown[]
  ) => Promise<AuditLogModuleOptions<TRecord>> | AuditLogModuleOptions<TRecord>;
}
