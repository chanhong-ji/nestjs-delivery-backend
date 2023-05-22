import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.types';
import { MailService } from './mail.service';

@Module({
    imports: [],
    providers: [
        {
            provide: CONFIG_OPTIONS,
            useFactory: (configService: ConfigService): MailModuleOptions => ({
                apiKey: configService.get('mailgun.apiKey'),
                emailDomain: configService.get('mailgun.domainName'),
            }),
            inject: [ConfigService],
        },
        MailService,
    ],
    exports: [MailService],
})
export class MailModule {}
