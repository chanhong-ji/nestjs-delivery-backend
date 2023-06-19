import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from 'src/users/entities/users.entity';
import { ErrorOutputs } from 'src/common/errors';
import { Verification } from 'src/users/entities/verifications.entity';

jest.mock('node-fetch');
jest.mock('form-data');

describe('AppController (e2e)', () => {
    const GRAPHQL_ENDPOINT = '/graphql';
    let app: INestApplication;
    let errors: ErrorOutputs;
    let repo: Repository<User>;
    let veriRepo: Repository<Verification>;
    let configService: ConfigService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        repo = app.get<Repository<User>>(getRepositoryToken(User));
        veriRepo = app.get<Repository<Verification>>(
            getRepositoryToken(Verification),
        );
        configService = app.get<ConfigService>(ConfigService);
        errors = new ErrorOutputs();

        // Testing User
        testEmail1 = configService.get('test.testEmail1');
        testEmail2 = configService.get('test.testEmail2');
        const testPassword = '1234';
        testUser = {
            email: testEmail1,
            password: testPassword,
            role: UserRole.Client,
        };

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // Configuration
    let userId: number;
    let token: string;
    let testEmail1: string;
    let testEmail2: string;
    let testUser;

    const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);

    const publicTest = (query: string) => baseTest().send({ query });

    const privateTest = (query: string) =>
        baseTest()
            .set({ Authorization: `Bearer ${token}` })
            .send({ query });

    describe('Create account', () => {
        it('success', () => {
            return publicTest(`mutation {
                    createAccount(email: "${testUser.email}", password: "${testUser.password}", role: ${testUser.role}) {
                    ok
                    error
                    }
                }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { createAccount },
                    } = res.body;
                    expect(createAccount.ok).toBe(true);
                    expect(createAccount.error).toBe(null);
                })
                .then(async () => {
                    const users = await repo.find();
                    const verifications = await veriRepo.find();
                    expect(users.length).toBe(1);
                    expect(verifications.length).toBe(1);

                    userId = users[0].id;
                });
        });

        it('fail if email is already taken', () => {
            return publicTest(`
                    mutation {
                        createAccount(email: "${testUser.email}", password: "${testUser.password}", role: ${testUser.role}) {
                        ok
                        error
                        }
                    }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { createAccount },
                    } = res.body;
                    expect(createAccount).toEqual(
                        errors.emailAlreadyTakenError,
                    );
                });
        });
    });

    describe('Login', () => {
        it('success', () => {
            return publicTest(`mutation {
                    login(email: "${testUser.email}", password: "${testUser.password}") {
                        ok
                        error
                        token
                    }
                }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { login },
                    } = res.body;
                    expect(login.ok).toBe(true);
                    expect(login.error).toBe(null);
                    expect(login.token).toEqual(expect.any(String));
                    token = login.token;
                });
        });

        it('fail with wrong password', () => {
            return publicTest(`
                mutation {
                    login(email: "${testUser.email}", password: "0") {   
                        ok
                        error
                        token
                    }
                }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { login },
                    } = res.body;
                    expect(login.ok).toEqual(errors.passwordWrongError.ok);
                    expect(login.error).toEqual(
                        errors.passwordWrongError.error,
                    );
                    expect(login.token).toBe(null);
                });
        });
    });

    describe('userProfile', () => {
        it('success', () => {
            return privateTest(`
                query {
                    userProfile(userId: ${userId}) {
                    ok
                    error
                    user {
                        id
                    }
                }
                }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { userProfile },
                    } = res.body;
                    expect(userProfile).toEqual({
                        ok: true,
                        error: null,
                        user: { id: userId },
                    });
                });
        });

        it('fail if user not found', async () => {
            return privateTest(`
                query {
                    userProfile(userId: ${100}) {
                    ok
                    error
                    user {
                        id
                    }
                    }
                }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { userProfile },
                    } = res.body;
                    expect(userProfile).toEqual({
                        ...errors.notFoundErrorOutput,
                        user: null,
                    });
                });
        });
    });

    describe('me', () => {
        it('success', async () => {
            return privateTest(`
                query {
                    me {
                    email
                    }
                }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { me },
                    } = res.body;
                    expect(me).toEqual({
                        email: testUser.email,
                    });
                });
        });

        it('fail if not authorized', async () => {
            return publicTest(`
                query {
                    me {
                    email
                    }
                }`)
                .expect(200)
                .expect((res) => {
                    const { errors } = res.body;
                    const error = errors[0];
                    expect(error.message).toBe('Forbidden resource');
                });
        });
    });

    describe('editProfile', () => {
        let newEmail: string;
        let password: string;
        beforeAll(async () => {
            newEmail = testEmail2;
            const [user] = await repo.find();
            password = user.password;
        });

        it('success', async () => {
            return privateTest(`mutation {
                editProfile(email: "${newEmail}", password: "${faker.internet.password()}") {
                  ok
                  error
                  user {
                    email
                  }
                }
              }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { editProfile },
                    } = res.body;
                    expect(editProfile).toEqual({
                        ok: true,
                        error: null,
                        user: {
                            email: newEmail,
                        },
                    });
                })
                .then(async () => {
                    const updatedUser = await repo.findOne({
                        where: { id: userId },
                    });
                    const verifications = await veriRepo.find();

                    expect(updatedUser.email).toBe(newEmail);
                    expect(updatedUser.verified).toBe(false);
                    expect(verifications.length).toBe(1);
                    expect(updatedUser.password).not.toBe(password);
                });
        });

        it('fail if not authorized', async () => {
            return publicTest(`mutation {
                editProfile(email: "${newEmail}") {
                  ok
                  error
                  user {
                    email
                  }
                }
              }`)
                .expect(200)
                .expect((res) => {
                    const { errors } = res.body;
                    expect(errors[0].message).toBe('Forbidden resource');
                });
        });
    });

    describe('verification', () => {
        let verificationCode;
        beforeAll(async () => {
            const verification = await veriRepo.findOne({
                where: { user: { id: userId } },
            });
            verificationCode = verification.code;
        });

        it('fail when code is wrong', async () => {
            return privateTest(`mutation {
                verifyEmailwithCode(code: "${faker.string.uuid()}") {
                  ok
                  error
                }
              }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { verifyEmailwithCode },
                    } = res.body;
                    expect(verifyEmailwithCode).toEqual(
                        errors.mailVerificationErrorOutput,
                    );
                })
                .then(async () => {
                    const user = await repo.findOne({ where: { id: userId } });
                    const verification = await veriRepo.findOne({
                        where: { user: { id: userId } },
                    });
                    expect(verification).toBeDefined();
                    expect(user.verified).toBe(false);
                });
        });

        it('success', async () => {
            return privateTest(`mutation {
                verifyEmailwithCode(code: "${verificationCode}") {
                  ok
                  error
                }
              }`)
                .expect(200)
                .expect((res) => {
                    const {
                        data: { verifyEmailwithCode },
                    } = res.body;
                    expect(verifyEmailwithCode).toEqual({
                        ok: true,
                        error: null,
                    });
                })
                .then(async () => {
                    const user = await repo.findOne({ where: { id: userId } });
                    const verification = await veriRepo.findOne({
                        where: { user: { id: userId } },
                    });
                    expect(verification).toBeNull();
                    expect(user.verified).toBe(true);
                });
        });
    });
});
