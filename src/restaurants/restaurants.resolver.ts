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
import { ErrorOutputs } from 'src/common/errors';

@Resolver()
export class RestaurantsResolver {
    constructor(
        private readonly service: RestaurantsService,
        @Inject('PER_PAGE') private readonly PER_PAGE,
        @Inject(ErrorOutputs) private readonly errors: ErrorOutputs,
    ) {}

    private async restaurantValidation(
        restaurant: Restaurant,
        user: User | null,
    ) {
        if (!restaurant) return this.errors.notFoundErrorOutput;

        if (user && restaurant.ownerId !== user.id)
            return this.errors.notAuthorizedError;
    }

    private async categoryValidation(category: Category) {
        if (!category) return this.errors.notFoundErrorOutput;
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

            return { ok: true, result: restaurant };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
        }
    }
}

@Resolver((of) => Category)
export class CategoriesResolver {
    constructor(
        private readonly service: RestaurantsService,
        @Inject(ErrorOutputs) private readonly errors: ErrorOutputs,
    ) {}

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
            return this.errors.dbErrorOutput;
        }
    }

    @Role(['Admin'])
    @Mutation((returns) => CreateCategoryOutput)
    async createCategory(
        @Args() args: CreateCategoryInput,
    ): Promise<CreateCategoryOutput> {
        try {
            const category = await this.service.findCategoryByName(args.name);
            if (category) return this.errors.categoryExistError;

            await this.service.createCategory(args.name);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
        }
    }
}

@Resolver((of) => Dish)
export class DishesResolver {
    constructor(
        private readonly service: RestaurantsService,
        @Inject(ErrorOutputs) private readonly errors: ErrorOutputs,
    ) {}

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
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
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
            return this.errors.dbErrorOutput;
        }
    }

    private async dishValidation(dish: Dish, user: User): Promise<CoreOutput> {
        if (!dish) return this.errors.notFoundErrorOutput;

        if (dish.restaurant.ownerId !== user.id)
            return this.errors.notAuthorizedError;
    }

    private async restaurantValidation(restaurant: Restaurant, user: User) {
        if (!restaurant) return this.errors.notFoundErrorOutput;

        if (restaurant.ownerId !== user.id)
            return this.errors.notAuthorizedError;
    }
}
