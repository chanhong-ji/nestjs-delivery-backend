import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtModuleOptions } from './jwt-module-options.interface';
import { CONFIG_OPTION } from './jwt.constants';

@Injectable()
export class JwtService {
    constructor(
        @Inject(CONFIG_OPTION) private configOption: JwtModuleOptions,
    ) {}

    sign(userId: number): string {
        return jwt.sign({ userId }, this.configOption.secretKey, {
            expiresIn: 60 * 60 * 24,
        });
    }

    verify(token: string) {
        return jwt.verify(token, this.configOption.secretKey);
    }
}
