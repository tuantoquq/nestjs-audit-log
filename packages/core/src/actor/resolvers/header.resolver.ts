export class HeaderActorResolver {
  constructor(private readonly headerName = 'x-actor-id') {}

  resolve(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const headers = request.headers;
    if (!isRecord(headers)) {
      return Promise.resolve({});
    }

    const value = headers[this.headerName];
    if (Array.isArray(value)) {
      const values = value as unknown[];
      const firstValue: unknown = values[0];
      return Promise.resolve(typeof firstValue === 'string' ? { id: firstValue } : {});
    }

    return Promise.resolve(typeof value === 'string' ? { id: value } : {});
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
