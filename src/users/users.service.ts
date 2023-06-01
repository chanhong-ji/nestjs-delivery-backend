import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { Verification } from './entities/verifications.entity';
import { CreateAccountInput } from './dtos/create-account.dto';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { VerifyCodeInput } from './dtos/verify-code.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly repo: Repository<User>,
        @InjectRepository(Verification)
        private readonly verificationService: Repository<Verification>,
        private readonly mailService: MailService,
    ) {}

    async findById(id: number): Promise<User> {
        return this.repo.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User> {
        return this.repo.findOne({ where: { email } });
    }

    async create(data: CreateAccountInput): Promise<Boolean> {
        const user = await this.repo.save(this.repo.create(data));

        const verification = await this.verificationService.save(
            this.verificationService.create({ user }),
        );

        await this.mailService.sendVerificationEmail(
            data.email,
            verification.code,
        );

        return true;
    }

    async update(user, data: EditProfileInput): Promise<User> {
        // Object.keys(data).forEach((key) => (user[key] = data[key]));
        return this.repo.save({ ...user, ...data });
    }

    async verifyCode(data: VerifyCodeInput): Promise<void> {
        const verification = await this.verificationService.findOne({
            where: { code: data.code },
            relations: ['user'],
        });

        verification.user.verified = true;

        await this.repo.save(verification.user);

        await this.verificationService.delete(verification.id);
    }
}
