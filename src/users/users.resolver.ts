import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/mail/mail.service';
import { ErrorOutputs } from 'src/common/errors';
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
        private mailService: MailService,
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

            // Send mail verification
            const user = await this.service.create(args);
            const verification = await this.service.createVerification(user.id);

            await this.mailService.sendVerificationEmail(
                args.email,
                verification.code,
            );

            return { ok: true };
        } catch (error) {
            console.log(error);
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
            console.log(error);
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
            console.log(error);
            return this.errors.dbErrorOutput;
        }
    }

    @Mutation((returns) => EditProfileOutput)
    async editProfile(
        @Args() args: EditProfileInput,
        @AuthUser() user: User,
    ): Promise<EditProfileOutput> {
        try {
            if (args.email) {
                const exist = await this.service.findByEmail(args.email);
                if (exist) {
                    return this.errors.emailAlreadyTakenError;
                }

                // Delete old verification and Create new one
                if (!user.verified) {
                    await this.service.deleteVerification(user.id);
                }
                const veri = await this.service.createVerification(user.id);

                this.mailService.sendVerificationEmail(args.email, veri.code);
            }

            const updatedUser = await this.service.update(user, {
                ...args,
                ...(args.email && { verified: false }),
            });

            return { ok: true, user: updatedUser };
        } catch (error) {
            console.log(error);
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
            console.log(error);
            return this.errors.mailVerificationErrorOutput;
        }
    }
}
