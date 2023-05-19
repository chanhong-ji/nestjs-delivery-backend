import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModuleOptions } from './jwt-module-options.interface';
import { CONFIG_OPTION } from './jwt.constants';

@Global()
@Module({
    providers: [JwtService],
})
export class JwtModule {
    static forRoot(options: JwtModuleOptions): DynamicModule {
        return {
            module: JwtModule,
            providers: [
                JwtService,
                { provide: CONFIG_OPTION, useValue: options },
            ],
            exports: [JwtService],
        };
    }
}
