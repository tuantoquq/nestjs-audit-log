import { ACTOR_REQUEST_KEY } from '../src/audit-log.constants';
import { ActorMiddleware } from '../src/actor/actor.middleware';
import type { ActorResolverService } from '../src/actor/actor-resolver.service';

describe('ActorMiddleware', () => {
  it('attaches the resolved actor to the request before calling next', async () => {
    const resolver: Pick<ActorResolverService, 'resolve'> = {
      resolve: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' }),
    };
    const middleware = new ActorMiddleware(resolver as ActorResolverService);
    const request: Record<string | symbol, unknown> = {};
    const next = jest.fn();

    middleware.use(request, {}, next);
    await flushPromises();

    expect(request[ACTOR_REQUEST_KEY]).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('falls back to an empty actor object when the resolver returns undefined', async () => {
    const resolver: Pick<ActorResolverService, 'resolve'> = {
      resolve: jest.fn().mockResolvedValue(undefined),
    };
    const middleware = new ActorMiddleware(resolver as ActorResolverService);
    const request: Record<string | symbol, unknown> = {};
    const next = jest.fn();

    middleware.use(request, {}, next);
    await flushPromises();

    expect(request[ACTOR_REQUEST_KEY]).toEqual({});
    expect(next).toHaveBeenCalledTimes(1);
  });
});

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
