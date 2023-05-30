import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly repo: Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) {}

    async findAll(): Promise<Restaurant[]> {
        return this.repo.find();
    }

    async create({
        userId,
        categoryId,
        ...data
    }: CreateRestaurantInput & { userId: number }): Promise<void> {
        await this.repo.save(
            this.repo.create({
                user: { id: userId },
                category: { id: categoryId },
                ...data,
            }),
        );
    }

    async findCategoryById(id: number): Promise<Category | null> {
        return this.categoryRepo.findOne({ where: { id } });
    }

    async checkCategoryByName(name: string): Promise<boolean> {
        return this.categoryRepo.exist({ where: { name } });
    }

    async createCategory(name: string) {
        return this.categoryRepo.save(this.categoryRepo.create({ name }));
    }
}
