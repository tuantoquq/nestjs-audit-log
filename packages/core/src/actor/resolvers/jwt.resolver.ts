export class JwtActorResolver {
  constructor(private readonly jwtField = 'user') {}

  resolve(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const actor = request[this.jwtField];
    return Promise.resolve(isRecord(actor) ? actor : {});
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
