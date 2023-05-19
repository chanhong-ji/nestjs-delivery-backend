import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private readonly userService: UsersService,
        private readonly authService: AuthService,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const token = this.extractTokenFromHeader(req);

        if (!token) {
            next();
            return;
        }

        try {
            const payload = await this.authService.verify(token);
            const user = await this.userService.findById(payload.userId);
            req['user'] = user;
        } catch (error) {
            if (error instanceof JsonWebTokenError) {
            } else if (error instanceof TokenExpiredError) {
            }
        }

        next();
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
