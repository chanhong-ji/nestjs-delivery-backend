import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
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
import { Inject } from '@nestjs/common';
import { ErrorOutputs } from 'src/common/errors';

@Resolver((of) => User)
export class UsersResolver {
    constructor(
        private readonly service: UsersService,
        private authService: AuthService,
        @Inject(ErrorOutputs) private readonly errors: ErrorOutputs,
    ) {}

    @Public()
    @Mutation((returns) => CreateAccountOutput)
    async createAccount(
        @Args() args: CreateAccountInput,
    ): Promise<CreateAccountOutput> {
        try {
            // Check if email is already taken
            const exist = await this.service.findByEmail(args.email);
            if (exist) return this.errors.emailAlreadyTakenError;

            await this.service.create(args);
            return { ok: true };
        } catch (error) {
            return this.errors.dbErrorOutput;
        }
    }

    @Public()
    @Mutation((returns) => LoginOutPut)
    async login(@Args() { email, password }: LoginInput): Promise<LoginOutPut> {
        try {
            // Check if user exists
            const user = await this.service.findByEmail(email);
            if (!user) return this.errors.notFoundErrorOutput;

            // Check if password is right
            const passwordConfirm = await user.checkPassword(password);
            if (!passwordConfirm) return this.errors.passwordWrongError;

            const token = await this.authService.sign(user.id);
            return { ok: true, token };
        } catch (error) {
            return this.errors.dbErrorOutput;
        }
    }

    @Query((returns) => User)
    me(@AuthUser() user): User {
        return user;
    }

    @Query((returns) => UserProfileOutput)
    async userProfile(
        @Args() args: UserProfileInput,
    ): Promise<UserProfileOutput> {
        try {
            const user = await this.service.findById(args.userId);
            if (!user) return this.errors.notFoundErrorOutput;

            return { ok: true, user };
        } catch (error) {
            return this.errors.dbErrorOutput;
        }
    }

    @Mutation((returns) => EditProfileOutput)
    async editProfile(
        @Args() args: EditProfileInput,
        @AuthUser() user,
    ): Promise<EditProfileOutput> {
        try {
            const updatedUser = await this.service.update(user, args);
            return { ok: true, user: updatedUser };
        } catch (error) {
            return this.errors.dbErrorOutput;
        }
    }

    @Public()
    @Mutation((returns) => VerifyCodeOutput)
    async verifyEmailwithCode(
        @Args() args: VerifyCodeInput,
    ): Promise<VerifyCodeOutput> {
        try {
            await this.service.verifyCode(args.code);
            return { ok: true };
        } catch (error) {
            return this.errors.mailVerificationErrorOutput;
        }
    }
}
