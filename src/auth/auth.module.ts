import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            global: true,
            useFactory: (configService: ConfigService) => ({
                signOptions: { expiresIn: configService.get('jwt.expiresIn') },
                secret: configService.get('jwt.secret'),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
