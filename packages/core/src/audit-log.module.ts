import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIT_LOG_OPTIONS, AUDIT_LOG_STORAGE } from './audit-log.constants';
import { AuditLogModuleAsyncOptions, AuditLogModuleOptions } from './audit-log.options';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './api/audit-log.controller';
import { ActorMiddleware } from './actor/actor.middleware';
import { ActorResolverService } from './actor/actor-resolver.service';
import { BufferedAuditAdapter } from './storage/buffered.adapter';
import { ConsoleAuditAdapter } from './storage/console.adapter';
import { InMemoryAuditAdapter } from './storage/memory.adapter';
import type { AuditStorageAdapter } from './storage/storage.adapter';

@Module({})
export class AuditLogModule {
  static forRoot(options: AuditLogModuleOptions): DynamicModule {
    return {
      module: AuditLogModule,
      providers: [{ provide: AUDIT_LOG_OPTIONS, useValue: options }, ...this.createCoreProviders()],
      controllers: options.exposeApi ? [AuditLogController] : [],
      exports: this.createExports(),
    };
  }

  static forRootAsync(options: AuditLogModuleAsyncOptions): DynamicModule {
    return {
      module: AuditLogModule,
      imports: [...(options.imports ?? [])],
      providers: [
        {
          provide: AUDIT_LOG_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ...this.createCoreProviders(),
      ],
      controllers: [],
      exports: this.createExports(),
    };
  }

  private static createCoreProviders(): Provider[] {
    return [
      AuditLogService,
      AuditLogInterceptor,
      ActorMiddleware,
      ActorResolverService,
      Reflector,
      ...this.createStorageProviders(),
    ];
  }

  private static createStorageProviders(): Provider[] {
    return [
      ConsoleAuditAdapter,
      InMemoryAuditAdapter,
      {
        provide: AUDIT_LOG_STORAGE,
        inject: [AUDIT_LOG_OPTIONS, ConsoleAuditAdapter, InMemoryAuditAdapter],
        useFactory: (
          options: AuditLogModuleOptions,
          consoleAdapter: ConsoleAuditAdapter,
          memoryAdapter: InMemoryAuditAdapter,
        ): AuditStorageAdapter => {
          const adapter = this.resolveStorageAdapter(options, consoleAdapter, memoryAdapter);

          if (!options.buffer?.enabled) {
            return adapter;
          }

          return new BufferedAuditAdapter(adapter, {
            batchSize: options.buffer.batchSize ?? 100,
            flushIntervalMs: options.buffer.flushIntervalMs ?? 1000,
          });
        },
      },
    ];
  }

  private static resolveStorageAdapter(
    options: AuditLogModuleOptions,
    consoleAdapter: ConsoleAuditAdapter,
    memoryAdapter: InMemoryAuditAdapter,
  ): AuditStorageAdapter {
    if (this.isStorageAdapter(options.storage)) {
      return options.storage;
    }

    return options.storage.type === 'memory' ? memoryAdapter : consoleAdapter;
  }

  private static isStorageAdapter(
    storage: AuditLogModuleOptions['storage'],
  ): storage is AuditStorageAdapter {
    return typeof (storage as AuditStorageAdapter).save === 'function';
  }

  private static createExports(): Array<
    | symbol
    | typeof AuditLogService
    | typeof AuditLogInterceptor
    | typeof ActorResolverService
    | typeof ConsoleAuditAdapter
    | typeof InMemoryAuditAdapter
  > {
    return [
      AUDIT_LOG_OPTIONS,
      AuditLogService,
      AuditLogInterceptor,
      ActorResolverService,
      ConsoleAuditAdapter,
      InMemoryAuditAdapter,
    ];
  }
}
