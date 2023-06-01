import {
    Args,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/entities/users.entity';
import { RestaurantsService } from './restaurants.service';
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
import {
    EditRestaurantInput,
    EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
    DeleteRestaurantInput,
    DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/see-restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { SeeCategoriesOutput } from './dtos/see-categories.dto';
import { Category } from './entities/category.entity';
import {
    SearchRestaurantInput,
    SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';

@Resolver()
export class RestaurantsResolver {
    RESTAURANT_NOT_FOUND_ERROR = 'Restaurant not found';
    RESTAURANT_NOT_AUTHORIZED_ERROR = 'Restaurant not authorized';
    CATEGORY_NOT_FOUND_ERROR = 'Category not found';
    DB_ERROR = 'DB error';

    constructor(
        private readonly service: RestaurantsService,
        @Inject('PER_PAGE') private readonly PER_PAGE,
    ) {}

    @Query((returns) => RestaurantOutput)
    async restaurant(
        @Args() { id }: RestaurantInput,
    ): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.service.findById(id);

            if (!restaurant)
                return { ok: false, error: this.RESTAURANT_NOT_FOUND_ERROR };

            return { ok: true, restaurant };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Query((returns) => RestaurantsOutput)
    async restaurants(
        @Args() args: RestaurantsInput,
    ): Promise<RestaurantsOutput> {
        try {
            const category = await this.service.findCategoryById(
                args.categoryId,
            );

            if (!category)
                return { ok: false, error: this.CATEGORY_NOT_FOUND_ERROR };

            const [restaurants, totalItems] =
                await this.service.findAllByCategory(
                    args.categoryId,
                    args.page,
                );

            return {
                ok: true,
                result: restaurants,
                totalItems,
                totalPages: Math.ceil(totalItems / this.PER_PAGE),
            };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => CreateRestaurantOutput)
    @Role(['Owner'])
    async createRestaurant(
        @Args() args: CreateRestaurantInput,
        @AuthUser() user: User,
    ): Promise<CreateRestaurantOutput> {
        try {
            // When category not found
            const category = await this.service.findCategoryById(
                args.categoryId,
            );
            if (!category)
                return { ok: false, error: this.CATEGORY_NOT_FOUND_ERROR };

            await this.service.create(user.id, args);

            return {
                ok: true,
            };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => EditRestaurantOutput)
    @Role(['Owner'])
    async editRestaurant(
        @Args() args: EditRestaurantInput,
        @AuthUser() user: User,
    ): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.service.findById(args.restaurantId);
            if (!restaurant)
                return { ok: false, error: this.RESTAURANT_NOT_FOUND_ERROR };

            if (restaurant.userId !== user.id)
                return {
                    ok: false,
                    error: this.RESTAURANT_NOT_AUTHORIZED_ERROR,
                };

            await this.service.update(restaurant, args);
            return { ok: true };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => DeleteRestaurantOutput)
    @Role(['Owner'])
    async deleteRestaurant(
        @Args() { id }: DeleteRestaurantInput,
        @AuthUser() user: User,
    ): Promise<DeleteRestaurantOutput> {
        try {
            // Check if restaurant exists
            const restaurant = await this.service.findById(id);
            if (!restaurant)
                return { ok: false, error: this.RESTAURANT_NOT_FOUND_ERROR };

            // Check if user is the owner of the restaurant
            if (restaurant.user.id !== user.id)
                return {
                    ok: false,
                    error: this.RESTAURANT_NOT_AUTHORIZED_ERROR,
                };

            await this.service.delete(id);
            return { ok: true };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Query((returns) => SearchRestaurantOutput)
    async searchRestaurant(
        @Args() { query, page }: SearchRestaurantInput,
    ): Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalItems] = await this.service.search(
                query,
                page,
            );
            return {
                ok: true,
                result: restaurants,
                totalItems,
                totalPages: Math.ceil(totalItems / this.PER_PAGE),
            };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }
}

@Resolver((of) => Category)
export class CategoriesResolver {
    CATEGORY_EXISTS_ERROR = 'Category already exists';
    DB_ERROR = 'DB error';

    constructor(private readonly service: RestaurantsService) {}

    @ResolveField((returns) => Int)
    async restaurantCount(@Parent() category: Category): Promise<number> {
        return this.service.countRestaurants(category.id);
    }

    @Query((returns) => SeeCategoriesOutput)
    @Public()
    async seeCategories(): Promise<SeeCategoriesOutput> {
        try {
            const categories = await this.service.findAllCategories();
            return { ok: true, categories };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Role(['Admin'])
    @Mutation((returns) => CreateCategoryOutput)
    async createCategory(
        @Args() args: CreateCategoryInput,
    ): Promise<CreateCategoryOutput> {
        try {
            const category = await this.service.findCategoryByName(args.name);
            if (category) {
                return { ok: false, error: this.CATEGORY_EXISTS_ERROR };
            }

            await this.service.createCategory(args.name);
            return { ok: true };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }
}
