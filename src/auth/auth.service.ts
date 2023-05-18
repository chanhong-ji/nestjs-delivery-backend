import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async sign(userId: number) {
        const payload = { userId };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('jwt.secret'),
        });
    }

    async verify(token: string) {
        return this.jwtService.verifyAsync(token, {
            secret: this.configService.get('jwt.secret'),
        });
    }
}
