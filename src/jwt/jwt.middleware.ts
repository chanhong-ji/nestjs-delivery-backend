import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from 'src/users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService,
    ) {}
    async use(req: Request, res: Response, next: NextFunction) {
        const token = this.extractTokenFromHeader(req);

        if (!token) {
            next();
            return;
        }

        try {
            const payload = this.jwtService.verify(token.toString());
            if (
                typeof payload === 'object' &&
                payload.hasOwnProperty('userId')
            ) {
                const user = await this.userService.findById(payload.userId);
                req['user'] = user;
            }
        } catch (error) {}

        next();
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
