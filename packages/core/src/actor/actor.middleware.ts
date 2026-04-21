import { Injectable, NestMiddleware } from '@nestjs/common';
import { setActorOnRequest } from '../request-context';
import { ActorResolverService } from './actor-resolver.service';

type NextFunction = () => void;

@Injectable()
export class ActorMiddleware implements NestMiddleware {
  constructor(private readonly actorResolver: ActorResolverService) {}

  use(req: Record<string, unknown>, _res: unknown, next: NextFunction): void {
    void this.actorResolver.resolve(req).then((actor) => {
      setActorOnRequest(req, actor);
      next();
    });
  }
}
