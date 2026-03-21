import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
        Logger.debug(
            'TODO: Here do stuff if we need to work with correlation-ids',
            'App:CorrelationID',
        );
        next();
    }
}
