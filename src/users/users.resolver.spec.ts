import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import { faker } from '@faker-js/faker';
import { User } from './entities/users.entity';

describe('Users - Resolver', () => {
    let resolver: UsersResolver;
    let service: Partial<Record<keyof UsersService, jest.Mock>>;
    let authService: Partial<Record<keyof AuthService, jest.Mock>>;

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
            ],
        }).compile();

        resolver = module.get<UsersResolver>(UsersResolver);
        service = module.get(UsersService);
        authService = module.get(AuthService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('createAccount', () => {
        it('returns ok when user is successfully created', async () => {
            const user = createFakeUser();
            service.findByEmail.mockResolvedValue(null);

            const result = await resolver.createAccount(user);

            expect(result).toEqual({ ok: true });
            expect(service.findByEmail).toHaveBeenCalledTimes(1);
            expect(service.findByEmail).toHaveBeenCalledWith(user.email);
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(service.create).toHaveBeenCalledWith({
                email: user.email,
                password: user.password,
                role: user.role,
            });
        });

        it('return false when email is already taken', async () => {
            const user = createFakeUser();
            service.findByEmail.mockResolvedValue(user);

            const result = await resolver.createAccount(user);

            expect(result).toEqual({
                ok: false,
                error: 'Email already taken',
            });
            expect(service.create).not.toHaveBeenCalled();
        });

        it('throw internal error when error occurs in service', async () => {
            const user = createFakeUser();
            service.findByEmail.mockRejectedValue('');

            await expect(resolver.createAccount(user)).rejects.toThrow();
        });
    });

    describe('login', () => {
        it('return ok & token when login success', async () => {
            const user = createFakeUser();
            const token = faker.string.alpha(5);
            service.findByEmail.mockResolvedValue(user);
            user.checkPassword = jest.fn(() => Promise.resolve(true));
            authService.sign.mockResolvedValue(token);

            const result = await resolver.login({
                email: user.email,
                password: user.password,
            });

            expect(result).toEqual({ ok: true, token });

            expect(service.findByEmail).toHaveBeenCalledTimes(1);
            expect(service.findByEmail).toBeCalledWith(user.email);

            expect(user.checkPassword).toHaveBeenCalledTimes(1);
            expect(user.checkPassword).toBeCalledWith(user.password);

            expect(authService.sign).toHaveBeenCalledTimes(1);
            expect(authService.sign).toBeCalledWith(user.id);
        });

        it('return false when email not found', async () => {
            const user = createFakeUser();
            service.findByEmail.mockResolvedValue(null);

            const result = await resolver.login({
                email: user.email,
                password: user.password,
            });

            expect(result).toEqual({ ok: false, error: 'User not found' });
            expect(service.findByEmail).toBeCalledWith(user.email);
        });

        it('return false when password confirm wrong', async () => {
            const user = createFakeUser();
            service.findByEmail.mockResolvedValue(user);
            user.checkPassword = jest.fn(() => Promise.resolve(false));

            const result = await resolver.login({
                email: user.email,
                password: user.password,
            });

            expect(result).toEqual({ ok: false, error: 'Password wrong' });
        });

        it('throw internal error when error occurs in service', async () => {
            const user = createFakeUser();
            service.findByEmail.mockRejectedValue('');

            await expect(resolver.login(user)).rejects.toThrow();
        });
    });

    describe('editProfile', () => {
        it('return ok, user when authorization success', async () => {
            const user = createFakeUser();
            const updatedData = {
                email: faker.internet.email(),
            };
            const editProfileInput = {
                userId: user.id,
                ...updatedData,
            };
            service.update.mockResolvedValue({ ...user, ...updatedData });

            const result = await resolver.editProfile(editProfileInput, user);

            expect(result).toEqual({
                ok: true,
                user: { ...user, ...updatedData },
            });
            expect(service.update).toHaveBeenCalledTimes(1);
            expect(service.update).toHaveBeenCalledWith(editProfileInput);
        });

        it('return false when user context not authorized', async () => {
            const user = createFakeUser();
            const editProfileInput = {
                userId: faker.number.int(),
            };

            const result = await resolver.editProfile(editProfileInput, user);

            expect(result).toEqual({
                ok: false,
                error: 'Not authorized',
            });
            expect(service.update).not.toHaveBeenCalled();
        });

        it('throw internal error when error occurs in service', async () => {
            const user = createFakeUser();
            const editProfileInput = {
                userId: user.id,
            };
            service.update.mockRejectedValue(null);

            await expect(
                resolver.editProfile(editProfileInput, user),
            ).rejects.toThrow();
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

            expect(result).toEqual({ ok: false, error: 'User not found' });
        });

        it('throw internal error when error occurs in service', async () => {
            service.findById.mockRejectedValue('');

            await expect(resolver.userProfile({ userId: 1 })).rejects.toThrow();
        });
    });

    describe('verifyEmailwithCode', () => {
        it('return ok when code is successfully verified', async () => {
            const verifyCodeInput = {
                code: faker.string.alphanumeric(5),
            };

            const result = await resolver.verifyEmailwithCode(verifyCodeInput);

            expect(result).toEqual({ ok: true });
            expect(service.verifyCode).toHaveBeenCalledWith(verifyCodeInput);
        });

        it('return false when error occurs in servie', async () => {
            service.verifyCode.mockRejectedValue(null);

            const result = await resolver.verifyEmailwithCode({ code: '' });

            expect(result).toEqual({ ok: false, error: 'Verification Fails' });
        });
    });
});

const createFakeUser = (): MockUser => ({
    id: faker.number.int(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: 0,
});

interface MockUser {
    id: number;
    email: string;
    password: string;
    role: 0 | 1 | 2;
    checkPassword?: () => Promise<boolean>;
    hashPassword?: () => {};
}
