import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/users.entity';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { RolesType } from './decorators/roles.decorator';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly userService: UsersService,
        private readonly authService: AuthService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) {
            return true;
        }

        const gqlContext = GqlExecutionContext.create(context).getContext();
        const token = this.extractTokenFromHeader(gqlContext.authorization);

        if (!token) return false;

        let user: User;
        try {
            const payload = await this.authService.verify(token);
            user = await this.userService.findById(payload.userId);
        } catch (error) {}

        if (!user) return false;

        const roles = this.reflector.get<RolesType[]>(
            'roles',
            context.getHandler(),
        );

        if (roles && !roles.includes(user.role)) {
            return false;
        }

        gqlContext['user'] = user;
        return true;
    }
    private extractTokenFromHeader(authorization): string | undefined {
        const [type, token] = authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
