import { Inject, Injectable, Optional } from '@nestjs/common';
import { AUDIT_LOG_OPTIONS } from '../audit-log.constants';
import type { ActorResolverOptions, AuditLogModuleOptions } from '../audit-log.options';
import { HeaderActorResolver } from './resolvers/header.resolver';
import { JwtActorResolver } from './resolvers/jwt.resolver';
import { SessionActorResolver } from './resolvers/session.resolver';

export interface ActorResolver {
  resolve(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

@Injectable()
export class ActorResolverService implements ActorResolver {
  private readonly options: ActorResolverOptions;

  constructor(
    @Optional()
    @Inject(AUDIT_LOG_OPTIONS)
    optionsOrModuleOptions?: AuditLogModuleOptions | ActorResolverOptions,
  ) {
    this.options = resolveActorOptions(optionsOrModuleOptions);
  }

  async resolve(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const resolver = this.options.resolver;
    if (typeof resolver === 'function') {
      return resolver(request);
    }

    if (resolver === 'session') {
      return new SessionActorResolver().resolve(request);
    }

    if (resolver === 'header') {
      return new HeaderActorResolver(this.options.headerName).resolve(request);
    }

    return new JwtActorResolver(this.options.jwtField).resolve(request);
  }
}

function resolveActorOptions(
  optionsOrModuleOptions: AuditLogModuleOptions | ActorResolverOptions | undefined,
): ActorResolverOptions {
  if (!optionsOrModuleOptions) {
    return { resolver: 'jwt', jwtField: 'user' };
  }

  if ('schema' in optionsOrModuleOptions) {
    return optionsOrModuleOptions.actor ?? { resolver: 'jwt', jwtField: 'user' };
  }

  return optionsOrModuleOptions;
}
