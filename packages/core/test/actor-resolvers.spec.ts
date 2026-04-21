import { ActorResolverService } from '../src/actor/actor-resolver.service';
import { HeaderActorResolver } from '../src/actor/resolvers/header.resolver';
import { JwtActorResolver } from '../src/actor/resolvers/jwt.resolver';
import { SessionActorResolver } from '../src/actor/resolvers/session.resolver';

describe('actor resolvers', () => {
  it('reads actor from configured request field for jwt resolver', async () => {
    const resolver = new JwtActorResolver('user');
    await expect(resolver.resolve({ user: { sub: 'user-1' } })).resolves.toEqual({
      sub: 'user-1',
    });
  });

  it('reads actor from session.user for session resolver', async () => {
    const resolver = new SessionActorResolver();
    await expect(resolver.resolve({ session: { user: { id: 'user-2' } } })).resolves.toEqual({
      id: 'user-2',
    });
  });

  it('reads actor id from configured header for header resolver', async () => {
    const resolver = new HeaderActorResolver('x-api-key-owner');
    await expect(resolver.resolve({ headers: { 'x-api-key-owner': 'owner-1' } })).resolves.toEqual({
      id: 'owner-1',
    });
  });

  it('uses custom actor resolver functions', async () => {
    const resolver = new ActorResolverService({
      resolver: (request) => {
        const headers = request.headers as Record<string, unknown>;
        return { id: headers['x-owner-id'] };
      },
    });

    await expect(resolver.resolve({ headers: { 'x-owner-id': 'owner-1' } })).resolves.toEqual({
      id: 'owner-1',
    });
  });
});
