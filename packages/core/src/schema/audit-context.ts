export interface DeepDiffEntry {
  from: unknown;
  to: unknown;
  kind: 'N' | 'D' | 'E' | 'A';
}

export type DeepDiff = Record<string, DeepDiffEntry>;

export interface AuditContext<TBody = unknown, TBefore = unknown, TAfter = unknown> {
  request: {
    ip: string;
    method: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, unknown>;
    headers: Record<string, string | string[] | undefined>;
  };
  actor: Record<string, unknown>;
  action: string;
  resource: string;
  resourceId: string | undefined;
  body: TBody;
  before: TBefore | undefined;
  after: TAfter | undefined;
  diff: DeepDiff | undefined;
  timestamp: Date;
  traceId: string | undefined;
  error: Error | undefined;
}
