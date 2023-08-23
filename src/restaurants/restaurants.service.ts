import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput } from './dtos/edit-restaurant.dto';
import { CreateDishInput } from './dtos/create-dish.dto';
import { EditDishInput } from './dtos/edit-dish.dto';

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepo: Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(Dish)
        private readonly dishRepo: Repository<Dish>,

        @Inject('PER_PAGE') private readonly PER_PAGE: number,
    ) {}

    async findById(id: number): Promise<Restaurant | null> {
        return this.restaurantRepo.findOne({
            where: { id },
        });
    }

    async findByIdWithDetail(id: number): Promise<Restaurant | null> {
        return this.restaurantRepo.findOne({
            where: { id },
            relations: ['menu', 'category'],
            select: {
                category: {
                    id: true,
                    name: true,
                },
            },
        });
    }

    async findByIdWithMenu(id: number): Promise<Restaurant | null> {
        return this.restaurantRepo.findOne({
            where: { id },
            relations: ['menu'],
        });
    }

    async findAllByCategory(
        categoryId: number,
        page: number,
    ): Promise<[Restaurant[], number]> {
        return this.restaurantRepo.findAndCount({
            where: { category: { id: categoryId } },
            skip: this.PER_PAGE * (page - 1),
            take: this.PER_PAGE,
        });
    }

    async findAllByOwner(ownerId: number): Promise<Restaurant[]> {
        return this.restaurantRepo.find({
            where: { owner: { id: ownerId } },
            relations: ['category'],
            select: {
                category: {
                    id: true,
                    name: true,
                },
            },
        });
    }

    async search(name: string, page: number): Promise<[Restaurant[], number]> {
        return this.restaurantRepo.findAndCount({
            where: { name: ILike(`%${name}%`) },
            take: this.PER_PAGE,
            skip: this.PER_PAGE * (page - 1),
            relations: ['category'],
            select: {
                category: {
                    id: true,
                    name: true,
                },
            },
        });
    }

    async create(
        ownerId: number,
        { categoryId, ...data }: CreateRestaurantInput,
    ): Promise<Restaurant> {
        return this.restaurantRepo.save(
            this.restaurantRepo.create({
                owner: {
                    id: ownerId,
                },
                category: {
                    id: categoryId,
                },
                ...data,
            }),
        );
    }

    async update(restaurant, data: EditRestaurantInput): Promise<void> {
        await this.restaurantRepo.save({ ...restaurant, ...data });
    }

    async delete(id: number): Promise<void> {
        await this.restaurantRepo.delete(id);
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
        return this.restaurantRepo.count({
            where: { category: { id: categoryId } },
        });
    }

    // Dish
    async findDishById(id: number) {
        return this.dishRepo.findOne({
            where: { id },
            relations: ['restaurant'],
        });
    }
    async createDish(data: CreateDishInput): Promise<void> {
        await this.dishRepo.save(
            this.dishRepo.create({
                ...data,
                restaurant: { id: data.restaurantId },
            }),
        );
    }

    async editDish(dish: Dish, data: EditDishInput): Promise<void> {
        await this.dishRepo.save({ ...dish, ...data });
    }

    async deleteDish(id: number): Promise<void> {
        await this.dishRepo.delete(id);
    }
}
