import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Role } from 'src/auth/decorators/roles.decorator';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { Order, OrderStatus } from './entities/order.entity';
import { User, UserRole } from 'src/users/entities/users.entity';
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
import { ErrorOutputs } from 'src/common/errors';

@Resolver((of) => Order)
export class OrdersResolver {
    constructor(
        private readonly service: OrdersService,
        @Inject('PER_PAGE') private readonly PER_PAGE,
        @Inject(ErrorOutputs) private readonly errors: ErrorOutputs,
    ) {}

    private orderValidation(order: Order) {
        if (!order) return this.errors.notFoundErrorOutput;
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
            return this.errors.dbErrorOutput;
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

            if (!authorized) return this.errors.notAuthorizedError;

            return { ok: true, result };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
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

            const restaurant = await this.service.findRestById(
                args.restaurantId,
            );
            if (!restaurant) return this.errors.notFoundErrorOutput;

            // Check dish and option & calculate total price

            let total: number = 0;

            for (const { dishId, choices } of args.items) {
                const dish = await this.service.findDishById(dishId);

                if (!dish) return this.errors.notFoundErrorOutput;

                total += dish.price;

                for (const choice of choices) {
                    const option = dish.dishOptions.find(
                        (option) => option.name === choice.name,
                    );

                    if (!option) return this.errors.notFoundErrorOutput;

                    total += option.extra;
                }
            }
            args['total'] = total;

            await this.service.create(user, args);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
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
                return this.errors.notAuthorizedError;

            // check if order is on pending
            if (order.status !== OrderStatus.Pending)
                return this.errors.wrongAccessError;

            await this.service.pendingToCooking(order);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
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
                return this.errors.notAuthorizedError;

            if (order.status !== OrderStatus.Cooking)
                return this.errors.wrongAccessError;

            const driver = await this.service.findDriverById(driverId);
            if (!driver) return this.errors.notFoundErrorOutput;

            await this.service.cookingToPickedUp(order, driverId);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
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
                return this.errors.notAuthorizedError;

            if (order.status !== OrderStatus.PickedUp)
                return this.errors.wrongAccessError;

            await this.service.pickedUpToDelivered(order);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
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
                    return this.errors.notAuthorizedError;
                }
            }

            if (user.role === UserRole.Owner) {
                if (order.restaurant.ownerId !== user.id) {
                    return this.errors.notAuthorizedError;
                }
            }

            if (order.status !== OrderStatus.Pending) {
                return this.errors.wrongAccessError;
            }

            await this.service.cancelOrder(order);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
        }
    }
}
