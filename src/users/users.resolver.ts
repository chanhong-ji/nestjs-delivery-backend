import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { InternalServerErrorException } from '@nestjs/common';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';
import {
    CreateAccountInput,
    CreateAccountOutput,
    LoginInput,
    LoginOutPut,
} from './dtos/create-account.dto';
import { Public } from 'src/auth/auth.decorator';
import { AuthService } from 'src/auth/auth.service';
import { AuthContext } from './interfaces/context.interface';

@Resolver((of) => User)
export class UsersResolver {
    constructor(
        private readonly service: UsersService,
        private authService: AuthService,
    ) {}

    @Public()
    @Query((returns) => String)
    hello() {
        return 'hello';
    }

    @Public()
    @Mutation((returns) => CreateAccountOutput)
    async createAccount(
        @Args() { email, password, role }: CreateAccountInput,
    ): Promise<CreateAccountOutput> {
        try {
            // Check if email is already taken
            const exist = await this.service.findByEmail(email);
            if (exist) {
                return { ok: false, error: 'Email already taken' };
            }

            await this.service.create({ email, password, role });
            return { ok: true };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException();
        }
    }

    @Public()
    @Mutation((returns) => LoginOutPut)
    async login(@Args() { email, password }: LoginInput): Promise<LoginOutPut> {
        try {
            // Check if user exists
            const user = await this.service.findByEmail(email);
            if (!user) {
                return { ok: false, error: 'User not found' };
            }

            // Check if password is right
            const passwordConfirm = await user.checkPassword(password);
            if (!passwordConfirm) {
                return { ok: false, error: 'Password wrong' };
            } else {
                const token = await this.authService.sign(user.id);
                return { ok: true, token };
            }
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException();
        }
    }

    @Query((returns) => User)
    me(@Context() ctx: AuthContext) {
        return ctx.user;
    }
}
