import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Role } from 'src/auth/decorators/roles.decorator';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { Order, OrderStatus } from './entities/order.entity';
import { User, UserRole } from 'src/users/entities/users.entity';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrdersInput, OrdersOutput } from './dtos/orders.dto';
import { OrderInput, OrderOutput } from './dtos/order.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { PickUpOrderInput, PickUpOrderOutput } from './dtos/pickup-order.dto';
import {
    DeliveredOrderInput,
    DeliveredOrderOutput,
} from './dtos/delivered-order.dto';
import { CancelOrderInput, CancelOrderOutput } from './dtos/cancel-order.dto';

@Resolver((of) => Order)
export class OrdersResolver {
    DB_ERROR = 'DB error';

    dbErrorOuput = {
        ok: false,
        error: this.DB_ERROR,
    };

    constructor(
        private readonly service: OrdersService,
        private readonly restaurantService: RestaurantsService,
        @Inject('PER_PAGE') private readonly PER_PAGE,
    ) {}

    restaurantValidation(id: number) {}

    orderValidation(order: Order) {
        if (!order) return { ok: false, error: 'Order not found' };
    }

    @Query((returns) => OrdersOutput)
    async orders(
        @Args() args: OrdersInput,
        @AuthUser() user: User,
    ): Promise<OrdersOutput> {
        try {
            const [orders, count] = await this.service.findAllByStatus(
                user,
                args.page,
                args.status,
            );

            return {
                ok: true,
                result: orders,
                totalItems: count,
                totalPages: Math.ceil(count / this.PER_PAGE),
            };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Query((returns) => OrderOutput)
    async order(
        @Args() { id }: OrderInput,
        @AuthUser() user: User,
    ): Promise<OrderOutput> {
        try {
            // Check if order exists
            const order = await this.service.findByIdForValidation(id);

            const validationError = this.orderValidation(order);
            if (validationError) return validationError;

            // Get result by user role
            let result;
            let authorized = false;

            if (user.role === UserRole.Client && order.customerId === user.id) {
                result = await this.service.findByIdForClient(id);
                authorized = true;
            } else if (
                user.role === UserRole.Delivery &&
                order.driverId === user.id
            ) {
                result = await this.service.findById(id);
                authorized = true;
            } else if (
                user.role === UserRole.Owner &&
                order.restaurant.ownerId === user.id
            ) {
                result = await this.service.findByIdForOwner(id);
                authorized = true;
            }

            if (!authorized) return { ok: false, error: 'Not authorized' };

            return { ok: true, result };
        } catch (error) {
            console.log(error);
            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => CreateOrderOutput)
    @Role(['Client'])
    async createOrder(
        @Args() args: CreateOrderInput,
        @AuthUser() user: User,
    ): Promise<CreateOrderOutput> {
        try {
            //Check restaurant

            const restaurant = this.restaurantService.findById(
                args.restaurantId,
            );
            if (!restaurant) return { ok: false, error: 'Not found' };

            // Check dish and option & calculate total price

            let total: number = 0;

            for (const { dishId, choices } of args.items) {
                const dish = await this.service.findDishById(dishId);

                if (!dish) return { ok: false, error: 'Not found' };

                total += dish.price;

                for (const choice of choices) {
                    const option = dish.dishOptions.find(
                        (option) => option.name === choice.name,
                    );

                    if (!option)
                        return { ok: false, error: 'Option not found' };

                    total += option.extra;
                }
            }
            args['total'] = total;

            await this.service.create(user, args);

            return { ok: true };
        } catch (error) {
            console.log(error);

            return { ok: false, error: this.DB_ERROR };
        }
    }

    @Mutation((returns) => TakeOrderOutput)
    @Role(['Owner'])
    async takeOrder(
        @Args() { id }: TakeOrderInput,
        @AuthUser() user: User,
    ): Promise<TakeOrderOutput> {
        try {
            const order = await this.service.findByIdForValidation(id);

            // Check if order exists
            const orderValidationError = this.orderValidation(order);
            if (orderValidationError) return orderValidationError;

            // check owner validation
            if (order.restaurant.ownerId !== user.id)
                return { ok: false, error: 'Not authorized' };

            // check if order is on pending
            if (order.status !== OrderStatus.Pending) {
                return { ok: false, error: 'Wrong access' };
            }

            await this.service.pendingToCooking(order);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.dbErrorOuput;
        }
    }

    @Mutation((returns) => PickUpOrderOutput)
    @Role(['Owner'])
    async pickUpOrder(
        @Args() { id, driverId }: PickUpOrderInput,
        @AuthUser() user: User,
    ): Promise<PickUpOrderOutput> {
        try {
            const order = await this.service.findByIdForValidation(id);

            const orderValidationError = this.orderValidation(order);
            if (orderValidationError) return orderValidationError;

            if (order.restaurant.ownerId !== user.id)
                return { ok: false, error: 'Not authorized' };

            if (order.status !== OrderStatus.Cooking) {
                return { ok: false, error: 'Wrong access' };
            }

            const driver = await this.service.findUserById(driverId);
            if (!driver || driver.role !== UserRole.Delivery)
                return { ok: false, error: 'driver error' };

            await this.service.cookingToPickedUp(order, driverId);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.dbErrorOuput;
        }
    }

    @Mutation((returns) => DeliveredOrderOutput)
    @Role(['Delivery'])
    async deliveredOrder(
        @Args() { id }: DeliveredOrderInput,
        @AuthUser() user: User,
    ): Promise<DeliveredOrderOutput> {
        try {
            const order = await this.service.findByIdForValidation(id);

            const orderValidationError = this.orderValidation(order);
            if (orderValidationError) return orderValidationError;

            if (order.driverId !== user.id)
                return { ok: false, error: 'Not authorized' };

            if (order.status !== OrderStatus.PickedUp) {
                return { ok: false, error: 'Wrong access' };
            }

            await this.service.pickedUpToDelivered(order);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.dbErrorOuput;
        }
    }

    @Mutation((returns) => CancelOrderOutput)
    @Role(['Client', 'Owner'])
    async cancelOrder(
        @Args() { id }: CancelOrderInput,
        @AuthUser() user: User,
    ): Promise<CancelOrderOutput> {
        try {
            const order = await this.service.findByIdForValidation(id);

            const orderValidationError = this.orderValidation(order);
            if (orderValidationError) return orderValidationError;

            if (user.role === UserRole.Client) {
                if (order.customerId !== user.id) {
                    return { ok: false, error: 'Not authorized' };
                }
            }

            if (user.role === UserRole.Delivery) {
                if (order.restaurant.ownerId !== user.id) {
                    return { ok: false, error: 'Not authorized' };
                }
            }

            if (order.status !== OrderStatus.Pending) {
                return { ok: false, error: 'Order is already accepted' };
            }

            await this.service.cancelOrder(order);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.dbErrorOuput;
        }
    }
}
