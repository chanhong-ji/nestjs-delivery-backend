import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UsersModule } from 'src/users/users.module';

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
        UsersModule,
    ],
    providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
    exports: [AuthService],
})
export class AuthModule {}
