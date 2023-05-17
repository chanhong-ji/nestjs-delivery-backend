import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';
import {
    CreateAccountInput,
    CreateAccountOutput,
    LoginInput,
    LoginOutPut,
} from './dtos/create-account.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Resolver((of) => User)
export class UsersResolver {
    constructor(private readonly service: UsersService) {}

    @Query((returns) => String)
    hello() {
        return 'hello';
    }

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
            console.log(error);
            throw new InternalServerErrorException();
        }
    }

    @Mutation((returns) => LoginOutPut)
    async login(@Args() { email, password }: LoginInput): Promise<LoginOutPut> {
        try {
            // Check if user exists
            const user = await this.service.findByEmail(email);
            if (!user) {
                return { ok: false, error: 'User not found' };
            }

            // Check if password is right
            const passwordConfirm = await bcrypt.compare(
                password,
                user.password,
            );
            if (!passwordConfirm) {
                return { ok: false, error: 'Password wrong' };
            }

            return { ok: true, token: 'example token' };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException();
        }
    }
}
