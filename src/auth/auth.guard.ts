import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/users.entity';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { RolesType } from './decorators/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) {
            return true;
        }

        const gqlContext = GqlExecutionContext.create(context).getContext();
        const user: User | undefined = gqlContext['user'];

        if (!user) return false;

        const roles = this.reflector.get<RolesType[]>(
            'roles',
            context.getHandler(),
        );

        if (roles && !roles.includes(user.role)) {
            return false;
        }

        return true;
    }
}
