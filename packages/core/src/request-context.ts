import { ACTOR_REQUEST_KEY } from './audit-log.constants';
import { AuditLogMetadata } from './audit-log.decorator';
import { AuditContext, DeepDiff } from './schema/audit-context';

export interface RequestLike {
  ip?: string;
  method?: string;
  path?: string;
  url?: string;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  [ACTOR_REQUEST_KEY]?: Record<string, unknown>;
}

export interface AuditContextValues {
  before?: unknown;
  after?: unknown;
  diff?: DeepDiff;
  error?: Error;
}

export function getActorFromRequest(request: RequestLike): Record<string, unknown> {
  return request[ACTOR_REQUEST_KEY] ?? {};
}

export function setActorOnRequest(
  request: RequestLike & Record<string | symbol, unknown>,
  actor: Record<string, unknown> | undefined,
): void {
  request[ACTOR_REQUEST_KEY] = actor ?? {};
}

export function buildAuditContextInput(
  request: RequestLike,
  actor: Record<string, unknown>,
  metadata: AuditLogMetadata,
  values: AuditContextValues = {},
): AuditContext {
  const baseContext: AuditContext = {
    request: {
      ip: request.ip ?? '',
      method: request.method ?? '',
      path: request.path ?? request.url ?? '',
      params: request.params ?? {},
      query: request.query ?? {},
      headers: request.headers ?? {},
    },
    actor,
    action: metadata.action,
    resource: metadata.resource,
    resourceId: undefined,
    body: request.body,
    before: values.before,
    after: values.after,
    diff: values.diff,
    timestamp: new Date(),
    traceId: readTraceId(request.headers),
    error: values.error,
  };

  return {
    ...baseContext,
    resourceId:
      typeof metadata.resourceId === 'function'
        ? metadata.resourceId(baseContext)
        : metadata.resourceId,
  };
}

function readTraceId(
  headers: Record<string, string | string[] | undefined> | undefined,
): string | undefined {
  const value = headers?.['x-request-id'];
  return Array.isArray(value) ? value[0] : value;
}
