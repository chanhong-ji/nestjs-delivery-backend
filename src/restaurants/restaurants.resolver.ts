import {
    Args,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { User } from 'src/users/entities/users.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
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
import { SeeCategoriesOutput } from './dtos/see-categories.dto';
import {
    SearchRestaurantInput,
    SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { CoreOutput } from 'src/common/dtos/output.dto';

@Resolver()
export class RestaurantsResolver {
    RESTAURANT_NOT_FOUND_ERROR = 'Restaurant not found';
    CATEGORY_NOT_FOUND_ERROR = 'Category not found';
    NOT_AUTHORIZED_ERROR = 'Not authorized';
    DB_ERROR = 'DB error';

    constructor(
        private readonly service: RestaurantsService,
        @Inject('PER_PAGE') private readonly PER_PAGE,
    ) {}

    private async restaurantValidation(
        restaurant: Restaurant,
        user: User | null,
    ) {
        if (!restaurant)
            return { ok: false, error: this.RESTAURANT_NOT_FOUND_ERROR };

        if (user && restaurant.ownerId !== user.id)
            return { ok: false, error: this.NOT_AUTHORIZED_ERROR };
    }

    private async categoryValidation(category: Category) {
        if (!category)
            return { ok: false, error: this.CATEGORY_NOT_FOUND_ERROR };
    }

    @Query((returns) => RestaurantOutput)
    async restaurant(
        @Args() { id }: RestaurantInput,
    ): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.service.findByIdWithMenu(id);

            const validationError = await this.restaurantValidation(
                restaurant,
                null,
            );
            if (validationError) return validationError;

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

            const validationError = await this.categoryValidation(category);
            if (validationError) return validationError;

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
            const validationError = await this.categoryValidation(category);
            if (validationError) return validationError;

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

            const validationError = await this.restaurantValidation(
                restaurant,
                user,
            );
            if (validationError) return validationError;

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
            const restaurant = await this.service.findById(id);

            const validationError = await this.restaurantValidation(
                restaurant,
                user,
            );
            if (validationError) return validationError;

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

@Resolver((of) => Dish)
export class DishesResolver {
    CATEGORY_EXISTS_ERROR = 'Category already exists';
    NOT_AUTHORIZED_ERROR = 'Not Authorized';
    DB_ERROR = 'DB error';
    RESTAURANT_NOT_FOUND = 'Restaurant not found';
    DISH_NOT_FOUND = 'Dish not found';

    constructor(private readonly service: RestaurantsService) {}

    @Mutation((returns) => CreateDishOutput)
    @Role(['Owner'])
    async createDish(
        @Args() args: CreateDishInput,
        @AuthUser() user: User,
    ): Promise<CreateDishOutput> {
        try {
            const restaurant = await this.service.findById(args.restaurantId);

            const validationError = await this.restaurantValidation(
                restaurant,
                user,
            );
            if (validationError) return validationError;

            await this.service.createDish(args);

            return {
                ok: true,
            };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => EditDishOutput)
    @Role(['Owner'])
    async editDish(
        @Args() args: EditDishInput,
        @AuthUser() user: User,
    ): Promise<EditDishOutput> {
        try {
            const dish = await this.service.findDishById(args.id);

            const validationError = await this.dishValidation(dish, user);
            if (validationError) return validationError;

            await this.service.editDish(dish, args);

            return {
                ok: true,
            };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => DeleteDishOutput)
    @Role(['Owner'])
    async deleteDish(@Args() { id }: DeleteDishInput, @AuthUser() user: User) {
        try {
            const dish = await this.service.findDishById(id);

            const validationError = await this.dishValidation(dish, user);
            if (validationError) return validationError;

            await this.service.deleteDish(id);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    private async dishValidation(dish: Dish, user: User): Promise<CoreOutput> {
        if (!dish) return { ok: false, error: this.DISH_NOT_FOUND };

        if (dish.restaurant.ownerId !== user.id)
            return { ok: false, error: this.NOT_AUTHORIZED_ERROR };
    }

    private async restaurantValidation(restaurant: Restaurant, user: User) {
        if (!restaurant) return { ok: false, error: this.RESTAURANT_NOT_FOUND };

        if (restaurant.ownerId !== user.id)
            return { ok: false, error: this.NOT_AUTHORIZED_ERROR };
    }
}
