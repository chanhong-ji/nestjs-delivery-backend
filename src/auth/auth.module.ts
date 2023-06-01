import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                signOptions: { expiresIn: configService.get('jwt.expiresIn') },
                secret: configService.get('jwt.secret'),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
    exports: [AuthService],
})
export class AuthModule {}
