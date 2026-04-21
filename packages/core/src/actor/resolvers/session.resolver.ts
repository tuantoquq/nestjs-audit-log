export class SessionActorResolver {
  resolve(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const session = request.session;
    if (!isRecord(session) || !isRecord(session.user)) {
      return Promise.resolve({});
    }

    return Promise.resolve(session.user);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
