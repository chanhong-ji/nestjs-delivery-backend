import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateAccountInput } from './dtos/create-account.dto';
import { editProfileInput } from './dtos/update-profile.dot';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ) {}

    async findById(id: number): Promise<User> {
        return this.repo.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User> {
        return this.repo.findOne({ where: { email } });
    }

    async create(data: CreateAccountInput): Promise<Boolean> {
        await this.repo.save(this.repo.create(data));
        return true;
    }

    async update({ userId, email, password }: editProfileInput): Promise<User> {
        const user = await this.findById(userId);
        if (email) {
            user.email = email;
        }
        if (password) {
            user.password = password;
        }
        return this.repo.save(user);
    }
}
