import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { Verification } from './entities/verifications.entity';
import { CreateAccountInput } from './dtos/create-account.dto';
import { EditProfileInput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly repo: Repository<User>,
        @InjectRepository(Verification)
        private readonly verificationRepo: Repository<Verification>,
    ) {}

    async findById(id: number): Promise<User> {
        return this.repo.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User> {
        return this.repo.findOne({ where: { email } });
    }

    async create(data: CreateAccountInput): Promise<User> {
        return this.repo.save(this.repo.create(data));
    }

    async update(user, data: EditProfileInput): Promise<User> {
        return this.repo.save({ ...user, ...data });
    }

    // Verification

    async createVerification(userId: number): Promise<Verification> {
        return this.verificationRepo.save(
            this.verificationRepo.create({ user: { id: userId } }),
        );
    }

    async deleteVerification(userId: number): Promise<void> {
        const veri = await this.verificationRepo.findOne({
            where: { user: { id: userId } },
        });
        await this.verificationRepo.delete(veri.id);
    }

    async verifyCode(code: string): Promise<void> {
        const verification = await this.verificationRepo.findOne({
            where: { code },
            relations: ['user'],
        });

        verification.user.verified = true;

        await this.repo.save(verification.user);

        await this.verificationRepo.delete(verification.id);
    }
}
