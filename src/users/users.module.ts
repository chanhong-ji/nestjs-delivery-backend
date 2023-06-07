import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Verification } from './entities/verifications.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { MailModule } from 'src/mail/mail.module';
import { ErrorOutputs } from 'src/common/errors';

@Module({
    imports: [TypeOrmModule.forFeature([User, Verification]), MailModule],
    providers: [UsersService, UsersResolver, ErrorOutputs],
    exports: [UsersService],
})
export class UsersModule {}
