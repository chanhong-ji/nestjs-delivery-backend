import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { InternalServerErrorException } from '@nestjs/common';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import {
    CreateAccountInput,
    CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutPut } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { VerifyCodeInput, VerifyCodeOutput } from './dtos/verify-code.dto';

@Resolver((of) => User)
export class UsersResolver {
    constructor(
        private readonly service: UsersService,
        private authService: AuthService,
    ) {}

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
            //console.error(error);
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
            //console.error(error);
            throw new InternalServerErrorException();
        }
    }

    @Query((returns) => User)
    me(@AuthUser() user): User {
        return user;
    }

    @Query((returns) => UserProfileOutput)
    async userProfile(
        @Args() userProfileInput: UserProfileInput,
    ): Promise<UserProfileOutput> {
        try {
            const user = await this.service.findById(userProfileInput.userId);

            if (!user) {
                return { ok: false, error: 'User not found' };
            }

            return { ok: true, user };
        } catch (error) {
            //console.error(error);
            throw new InternalServerErrorException();
        }
    }

    @Mutation((returns) => EditProfileOutput)
    async editProfile(
        @Args() EditProfileInput: EditProfileInput,
        @AuthUser() user,
    ): Promise<EditProfileOutput> {
        try {
            const updatedUser = await this.service.update(
                user,
                EditProfileInput,
            );
            return { ok: true, user: updatedUser };
        } catch (error) {
            //console.error(error);
            throw new InternalServerErrorException();
        }
    }

    @Public()
    @Mutation((returns) => VerifyCodeOutput)
    async verifyEmailwithCode(
        @Args() verifyCodeInput: VerifyCodeInput,
    ): Promise<VerifyCodeOutput> {
        try {
            await this.service.verifyCode(verifyCodeInput);
            return { ok: true };
        } catch (error) {
            return { ok: false, error: 'Verification Fails' };
        }
    }
}
