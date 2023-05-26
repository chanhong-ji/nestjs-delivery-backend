import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;
    const SECRET_KEY = faker.string.alphanumeric(5);
    const TOKEN = faker.string.alphanumeric(5);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(() => Promise.resolve(TOKEN)),
                        verifyAsync: jest.fn(() => {}),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(() => SECRET_KEY),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sign', () => {
        it('return', async () => {
            const userId = faker.number.int(3);

            const result = await service.sign(userId);

            expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
            expect(jwtService.signAsync).toHaveBeenCalledWith(
                { userId },
                { secret: SECRET_KEY },
            );
            expect(result).toBe(TOKEN);
        });
    });

    describe('verify', () => {
        it('return ', async () => {
            const token = faker.string.alphanumeric(5);

            await service.verify(token);

            expect(jwtService.verifyAsync).toHaveBeenCalledTimes(1);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
                secret: SECRET_KEY,
            });
        });
    });
});
