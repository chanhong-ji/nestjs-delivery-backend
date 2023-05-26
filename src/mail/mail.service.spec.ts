import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { MailService } from './mail.service';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

jest.mock('form-data');
jest.mock('node-fetch');

describe('MailService', () => {
    let service: MailService;
    const API_KEY: string = faker.string.alphanumeric(5);
    const EMAIL_DOMAIN: string = faker.string.numeric(10);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: CONFIG_OPTIONS,
                    useValue: {
                        apiKey: API_KEY,
                        emailDomain: EMAIL_DOMAIN,
                    },
                },
            ],
        }).compile();

        service = module.get<MailService>(MailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        it('return true when email is verified', async () => {
            const email = faker.internet.email();
            const code = faker.string.alphanumeric();
            const TEMPLATE = 'verify-email';
            jest.spyOn(service, 'sendEmail').mockImplementation(
                async (email, templateVariables, template) => {},
            );

            const result = await service.sendVerificationEmail(email, code);

            expect(result).toBe(true);
            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith(
                email,
                [
                    { key: 'code', value: code },
                    { key: 'username', value: email },
                ],
                TEMPLATE,
            );
        });

        it('return false when error occurs', async () => {
            jest.spyOn(service, 'sendEmail').mockRejectedValue('');

            const result = await service.sendVerificationEmail('', '');

            expect(result).toBe(false);
        });
    });

    describe('sendEmail', () => {
        it('success', async () => {
            const email = faker.internet.email();
            const templateVariables = [
                { key: 'code', value: faker.string.alphanumeric() },
                { key: 'username', value: faker.internet.email() },
            ];
            const template = 'verify-email';
            const formSpy = jest.spyOn(FormData.prototype, 'append');

            await service.sendEmail(email, templateVariables, template);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(
                `https://api.mailgun.net/v3/${EMAIL_DOMAIN}/messages`,
                expect.any(Object),
            );
            expect(formSpy).toHaveBeenCalled();
            expect(formSpy).toHaveBeenCalledWith('to', email);
            expect(formSpy).toHaveBeenCalledWith('template', template);
            templateVariables.forEach(({ key, value }) => {
                expect(formSpy).toHaveBeenCalledWith(`v:${key}`, value);
            });
        });
    });
});
