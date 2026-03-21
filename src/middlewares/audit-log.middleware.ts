import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
        Logger.debug('TODO: Here log everything that comes in for audit-logging', 'App:AuditLog');
        next();
    }
}
