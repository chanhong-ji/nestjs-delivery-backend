import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput } from './dtos/edit-restaurant.dto';

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly repo: Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @Inject('PER_PAGE') private readonly PER_PAGE: number,
    ) {}

    async findById(id: number): Promise<Restaurant | null> {
        return this.repo.findOne({
            where: { id },
            loadRelationIds: true,
        });
    }

    async findAllByCategory(
        categoryId: number,
        page: number,
    ): Promise<[Restaurant[], number]> {
        return this.repo.findAndCount({
            where: { category: { id: categoryId } },
            skip: this.PER_PAGE * (page - 1),
            take: this.PER_PAGE,
        });
    }

    async search(name: string, page: number): Promise<[Restaurant[], number]> {
        return this.repo.findAndCount({
            where: { name: ILike(`%${name}%`) },
            take: this.PER_PAGE,
            skip: this.PER_PAGE * (page - 1),
            loadRelationIds: {
                relations: ['category'],
            },
        });
    }

    async create(
        userId: number,
        { categoryId, ...data }: CreateRestaurantInput,
    ): Promise<void> {
        await this.repo.save(
            this.repo.create({
                userId,
                categoryId,
                ...data,
            }),
        );
    }

    async update(restaurant, data: EditRestaurantInput): Promise<void> {
        await this.repo.save({ ...restaurant, ...data });
    }

    async delete(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    // Category

    async findAllCategories(): Promise<Category[]> {
        return this.categoryRepo.find();
    }
    async findCategoryById(id: number): Promise<Category | null> {
        return this.categoryRepo.findOne({ where: { id } });
    }

    async findCategoryByName(name: string): Promise<Category | null> {
        return this.categoryRepo.findOne({ where: { name } });
    }

    async createCategory(name: string) {
        return this.categoryRepo.save(this.categoryRepo.create({ name }));
    }

    async countRestaurants(categoryId: number): Promise<number> {
        return this.repo.count({
            where: { category: { id: categoryId } },
        });
    }
}
