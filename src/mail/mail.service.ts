import { Inject, Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailTemplate, EmailVar, MailModuleOptions } from './mail.types';

@Injectable()
export class MailService {
    constructor(
        @Inject(CONFIG_OPTIONS)
        private readonly options: MailModuleOptions,
    ) {}

    async sendEmail(
        email: string,
        templateVariables: EmailVar[],
        template: EmailTemplate,
    ) {
        // Create a Form
        const form = new FormData();
        form.append('from', `Delivery <Delivery@mailgun-test.com>`);
        form.append('to', email);
        form.append('template', template);
        templateVariables.forEach((element) => {
            element.key;
            form.append(`v:${element.key}`, element.value);
            if (element.key === 'code') {
                form.append(
                    'v:arrivaladdress',
                    `http://localhost:3000/confirm-code?code=${element.value}`,
                    ``,
                );
            }
        });

        // Send email
        const url = `https://api.mailgun.net/v3/${this.options.emailDomain}/messages`;
        const fetchOptions = {
            method: 'POST',
            headers: {
                Authorization:
                    'Basic ' + this.encodingText(`api:${this.options.apiKey}`),
            },
            body: form,
        };

        await fetch(url, fetchOptions);
    }

    private encodingText(text: string): string {
        return Buffer.from(text).toString('base64');
    }

    async sendVerificationEmail(email: string, code: string): Promise<boolean> {
        try {
            const TEMPLATE = 'verify-email';
            await this.sendEmail(
                email,
                [
                    { key: 'code', value: code },
                    { key: 'username', value: email },
                ],
                TEMPLATE,
            );
            return true;
        } catch (error) {
            return false;
        }
    }
}
