import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InternalServerErrorException } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { User } from 'src/users/entities/users.entity';
import { RestaurantsService } from './restaurants.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { Role } from 'src/auth/decorators/roles.decorator';
import {
    CreateRestaurantInput,
    CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
    CreateCategoryInput,
    CreateCategoryOutput,
} from './dtos/create-category.dto';

@Resolver()
export class RestaurantsResolver {
    constructor(private readonly service: RestaurantsService) {}

    @Public()
    @Query((returns) => [Restaurant])
    async getAll() {
        return this.service.findAll();
    }

    @Role(['Admin'])
    @Mutation((returns) => CreateCategoryOutput)
    async createCategory(
        @Args() createCategoryInput: CreateCategoryInput,
    ): Promise<CreateCategoryOutput> {
        try {
            const exist = await this.service.checkCategoryByName(
                createCategoryInput.name,
            );
            if (exist) {
                return { ok: false, error: 'Category already exists' };
            }

            await this.service.createCategory(createCategoryInput.name);
            return { ok: true };
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    @Mutation((returns) => CreateRestaurantOutput)
    @Role(['Owner'])
    async createRestaurant(
        @Args() createRestaurantInput: CreateRestaurantInput,
        @AuthUser() user: User,
    ): Promise<CreateRestaurantOutput> {
        try {
            // When category not found
            const category = await this.service.findCategoryById(
                createRestaurantInput.categoryId,
            );
            if (!category) return { ok: false, error: 'Category not found' };

            await this.service.create({
                userId: user.id,
                ...createRestaurantInput,
            });

            return {
                ok: true,
            };
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }
}
