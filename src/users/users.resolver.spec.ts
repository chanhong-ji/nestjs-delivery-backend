import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import { faker } from '@faker-js/faker';
import { User, UserRole } from './entities/users.entity';
import { ErrorOutputs } from 'src/common/errors';

describe('Users - Resolver', () => {
    let resolver: UsersResolver;
    let service: Partial<Record<keyof UsersService, jest.Mock>>;
    let authService: Partial<Record<keyof AuthService, jest.Mock>>;
    let errors: ErrorOutputs;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [User],
            providers: [
                UsersResolver,
                {
                    provide: UsersService,
                    useValue: {
                        findById: jest.fn(),
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        verifyCode: jest.fn(),
                    },
                },
                {
                    provide: AuthService,
                    useValue: {
                        sign: jest.fn(),
                        verify: jest.fn(),
                    },
                },
                ErrorOutputs,
            ],
        }).compile();

        resolver = module.get<UsersResolver>(UsersResolver);
        service = module.get(UsersService);
        authService = module.get(AuthService);
        errors = module.get(ErrorOutputs);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('createAccount', () => {
        let user: MockUser;
        let inputData: Pick<MockUser, 'email' | 'password' | 'role'>;
        beforeEach(() => {
            user = createFakeUser();
            inputData = {
                email: user.email,
                password: user.password,
                role: user.role,
            };
        });
        it('returns ok when user is successfully created', async () => {
            service.findByEmail.mockResolvedValue(null);

            const result = await resolver.createAccount(inputData);

            expect(result).toEqual({ ok: true });
            expect(service.findByEmail).toHaveBeenCalledTimes(1);
            expect(service.findByEmail).toHaveBeenCalledWith(inputData.email);
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(service.create).toHaveBeenCalledWith(inputData);
        });

        it('return false when email is already taken', async () => {
            service.findByEmail.mockResolvedValue(user);

            const result = await resolver.createAccount(inputData);

            expect(result).toEqual(errors.emailAlreadyTakenError);
            expect(service.create).not.toHaveBeenCalled();
        });

        it('return false when error occurs in service', async () => {
            service.findByEmail.mockRejectedValue(new Error());

            const result = await resolver.createAccount(inputData);

            expect(result).toBe(errors.dbErrorOutput);
        });
    });

    describe('login', () => {
        let user: MockUser;
        let inputData: Pick<MockUser, 'email' | 'password'>;
        beforeEach(() => {
            user = createFakeUser();
            inputData = { email: user.email, password: user.password };
        });
        it('return ok & token when login success', async () => {
            const token = faker.string.alpha(5);
            service.findByEmail.mockResolvedValue(user);
            user.checkPassword = jest.fn(() => Promise.resolve(true));
            authService.sign.mockResolvedValue(token);

            const result = await resolver.login(inputData);

            expect(result).toEqual({ ok: true, token });

            expect(service.findByEmail).toHaveBeenCalledTimes(1);
            expect(service.findByEmail).toBeCalledWith(inputData.email);

            expect(user.checkPassword).toHaveBeenCalledTimes(1);
            expect(user.checkPassword).toBeCalledWith(inputData.password);

            expect(authService.sign).toHaveBeenCalledTimes(1);
            expect(authService.sign).toBeCalledWith(user.id);
        });

        it('return false when email not found', async () => {
            service.findByEmail.mockResolvedValue(null);

            const result = await resolver.login(inputData);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.findByEmail).toBeCalledWith(user.email);
        });

        it('return false when password confirm wrong', async () => {
            service.findByEmail.mockResolvedValue(user);
            user.checkPassword = jest.fn(() => Promise.resolve(false));

            const result = await resolver.login(inputData);

            expect(result).toEqual(errors.passwordWrongError);
        });

        it('return false when error occurs in service', async () => {
            const user = createFakeUser();
            service.findByEmail.mockRejectedValue('');

            const result = await resolver.login(user);

            expect(result).toBe(errors.dbErrorOutput);
        });
    });

    describe('editProfile', () => {
        let user: MockUser;

        beforeEach(() => {
            user = createFakeUser();
        });

        it('return ok, user when authorization success', async () => {
            const updatedData = {
                email: faker.internet.email(),
            };
            service.update.mockResolvedValue({ ...user, ...updatedData });

            const result = await resolver.editProfile(updatedData, user);

            expect(result).toEqual({
                ok: true,
                user: { ...user, ...updatedData },
            });
            expect(service.update).toHaveBeenCalledTimes(1);
            expect(service.update).toHaveBeenCalledWith(user, updatedData);
        });

        it('return false when error occurs in service', async () => {
            service.update.mockRejectedValue(null);

            const result = await resolver.editProfile({}, user);

            expect(result).toBe(errors.dbErrorOutput);
        });
    });

    describe('me', () => {
        it('return me', async () => {
            const user = createFakeUser();

            const result = await resolver.me(user);

            expect(result).toEqual(user);
        });
    });

    describe('userProfile', () => {
        it('return true, user when user exists', async () => {
            const user = createFakeUser();
            service.findById.mockResolvedValue(user);
            const userProfileInput = {
                userId: user.id,
            };

            const result = await resolver.userProfile(userProfileInput);

            expect(result).toEqual({ ok: true, user });
            expect(service.findById).toHaveBeenCalledWith(
                userProfileInput.userId,
            );
        });

        it('return false when user not found', async () => {
            const user = createFakeUser();
            service.findById.mockResolvedValue(null);
            const userProfileInput = {
                userId: user.id,
            };

            const result = await resolver.userProfile(userProfileInput);

            expect(result).toEqual(errors.notFoundErrorOutput);
        });

        it('return false when error occurs in service', async () => {
            service.findById.mockRejectedValue('');

            const result = await resolver.userProfile({ userId: 1 });

            expect(result).toBe(errors.dbErrorOutput);
        });
    });

    describe('verifyEmailwithCode', () => {
        it('return ok when code is successfully verified', async () => {
            const verifyCodeInput = {
                code: faker.string.alphanumeric(5),
            };

            const result = await resolver.verifyEmailwithCode(verifyCodeInput);

            expect(result).toEqual({ ok: true });
            expect(service.verifyCode).toHaveBeenCalledWith(
                verifyCodeInput.code,
            );
        });

        it('return false when error occurs in servie', async () => {
            service.verifyCode.mockRejectedValue(null);

            const result = await resolver.verifyEmailwithCode({ code: '' });

            expect(result).toEqual(errors.mailVerificationErrorOutput);
        });
    });
});

const createFakeUser = (): MockUser => ({
    id: faker.number.int(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: UserRole.Client,
});

interface MockUser {
    id: number;
    email: string;
    password: string;
    role: UserRole;
    checkPassword?: () => Promise<boolean>;
    hashPassword?: () => {};
}
