import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { OrdersService } from './orders.service';
import { Role } from 'src/auth/decorators/roles.decorator';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { Order, OrderStatus } from './entities/order.entity';
import { User, UserRole } from 'src/users/entities/users.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrdersInput, OrdersOutput } from './dtos/orders.dto';
import { OrderInput, OrderOutput } from './dtos/order.dto';
import {
    EditOrderForOwnerInput,
    EditOrderForOwnerOutput,
    OrderStatusForOwner,
} from './dtos/edit-order-for-owner';
import { CancelOrderInput, CancelOrderOutput } from './dtos/cancel-order.dto';
import { ErrorOutputs } from 'src/common/errors';
import { PUB_SUB } from 'src/common/common.constants';
import {
    EditOrderForDeliveryInput,
    EditOrderForDeliveryOutput,
    OrderStatusForDelivery,
} from './dtos/edit-order-for-delivery';
import { OrderUpdateInput } from './dtos/order-update.dto';

const NEW_PENDING_ORDERS = 'NEW_PENDING_ORDERS';
const NEW_COOKED_ORDERS = 'NEW_COOKED_ORDERS';
const ORDER_UPDATES = 'ORDER_UPDATES';
const ACCEPTED_ORDERS = 'NEW_ACCEPTED_ORDERS';

@Resolver((of) => Order)
export class OrdersResolver {
    constructor(
        private readonly service: OrdersService,
        @Inject('PER_PAGE') private readonly PER_PAGE,
        @Inject(ErrorOutputs) private readonly errors: ErrorOutputs,
        @Inject(PUB_SUB) private readonly pubSub: PubSub,
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
            const order = await this.service.findByIdWithDetail(id);

            const validationError = this.orderValidation(order);
            if (validationError) return validationError;

            if (
                (user.role === UserRole.Client &&
                    order.customerId === user.id) ||
                (user.role === UserRole.Delivery &&
                    order.driverId === user.id) ||
                (user.role === UserRole.Owner &&
                    order.restaurant.ownerId === user.id)
            ) {
                return { ok: true, result: order };
            } else {
                return this.errors.notAuthorizedError;
            }
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

                if (!choices) continue;

                for (const choice of choices) {
                    const option = dish.dishOptions.find(
                        (option) => option.name === choice.name,
                    );

                    if (!option) return this.errors.notFoundErrorOutput;

                    total += option.extra;
                }
            }
            args['total'] = total;

            const { id } = await this.service.create(user, args);

            // Data for subscription for owner of the restaurant
            const order = await this.service.findByIdWithDetail(id);
            await this.pubSub.publish(NEW_PENDING_ORDERS, {
                order,
                ownerId: restaurant.ownerId,
            });

            return { ok: true, orderId: order.id };
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
            const order = await this.service.findById(id);

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

            this.pubSub.publish(ORDER_UPDATES, {
                order: { ...order, status: OrderStatus.Canceled },
                ownerId: order.restaurant.ownerId,
            });

            await this.service.editOrder(order, OrderStatus.Canceled);

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
        }
    }

    @Mutation((returns) => EditOrderForOwnerOutput)
    @Role(['Owner'])
    async editOrderForOwner(
        @Args() { id, status }: EditOrderForOwnerInput,
        @AuthUser() user: User,
    ): Promise<EditOrderForOwnerOutput> {
        try {
            const order = await this.service.findById(id);

            // Check if order exists
            const orderValidationError = this.orderValidation(order);
            if (orderValidationError) return orderValidationError;

            // check owner validation
            if (order.restaurant.ownerId !== user.id)
                return this.errors.notAuthorizedError;

            // Pending => Cooking
            if (status === OrderStatusForOwner.Cooking) {
                // check if order is on pending
                if (order.status !== OrderStatus.Pending)
                    return this.errors.wrongAccessError;

                await this.service.editOrder(order, OrderStatus.Cooking);

                const orderWithDetail = await this.service.findByIdWithDetail(
                    order.id,
                );

                this.pubSub.publish(ACCEPTED_ORDERS, {
                    order: orderWithDetail,
                });
            }
            // Cooking => Cooked
            else if (status === OrderStatusForOwner.Cooked) {
                if (order.status !== OrderStatus.Cooking)
                    return this.errors.wrongAccessError;

                await this.service.editOrder(order, OrderStatus.Cooked);

                const orderWithDetail = await this.service.findByIdWithDetail(
                    order.id,
                );

                this.pubSub.publish(NEW_COOKED_ORDERS, {
                    order: orderWithDetail,
                });
            }

            this.pubSub.publish(ORDER_UPDATES, {
                order: { ...order, status },
                ownerId: order.restaurant.ownerId,
            });

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
        }
    }

    @Mutation((returns) => EditOrderForDeliveryOutput)
    @Role(['Delivery'])
    async editOrderForDelivery(
        @Args() { id, status }: EditOrderForDeliveryInput,
        @AuthUser() user: User,
    ): Promise<EditOrderForDeliveryOutput> {
        try {
            const order = await this.service.findById(id);

            const orderValidationError = this.orderValidation(order);
            if (orderValidationError) return orderValidationError;

            // Take Order
            if (!status) {
                if (order.driverId) return this.errors.wrongAccessError;

                if (
                    order.status === OrderStatus.Pending ||
                    order.status === OrderStatus.Canceled
                )
                    return this.errors.wrongAccessError;

                await this.service.assignDriver(order, user.id);

                this.pubSub.publish(ORDER_UPDATES, {
                    order: {
                        ...order,
                        driver: { id: user.id, email: user.email },
                    },
                    ownerId: order.restaurant.ownerId,
                });
            } else {
                // Cooked => PickedUp
                if (status === OrderStatusForDelivery.PickedUp) {
                    if (order.driverId !== user.id)
                        return this.errors.notAuthorizedError;

                    if (order.status !== OrderStatus.Cooked)
                        return this.errors.wrongAccessError;

                    await this.service.editOrder(order, OrderStatus.PickedUp);
                }
                // PickedUp => Delivered
                else if (status === OrderStatusForDelivery.Delivered) {
                    if (order.driverId !== user.id)
                        return this.errors.notAuthorizedError;

                    if (order.status !== OrderStatus.PickedUp)
                        return this.errors.wrongAccessError;
                    await this.service.editOrder(order, OrderStatus.Delivered);
                }

                this.pubSub.publish(ORDER_UPDATES, {
                    order: { ...order, status },
                    ownerId: order.restaurant.ownerId,
                });
            }

            return { ok: true };
        } catch (error) {
            console.log(error);
            return this.errors.dbErrorOutput;
        }
    }

    // Subscription

    // subscription for owner (new pending orders)
    @Role(['Owner'])
    @Subscription((returns) => Order, {
        filter: (
            { ownerId }: { ownerId: number },
            _,
            { user }: { user: User },
        ) => ownerId === user.id,
        resolve: ({ order }) => order,
    })
    pendingOrders() {
        return this.pubSub.asyncIterator(NEW_PENDING_ORDERS);
    }

    // subscription for delivery (new accepted orders)
    @Role(['Delivery'])
    @Subscription((returns) => Order, {
        filter: ({ order }: { order: Order }, _, { user }: { user: User }) =>
            order.restaurant.dongCode === user.dongCode,
        resolve: ({ order }) => order,
    })
    acceptedOrders() {
        return this.pubSub.asyncIterator(ACCEPTED_ORDERS);
    }

    // subscription for delivery (new cooked orders)
    @Role(['Delivery'])
    @Subscription((returns) => Order, {
        filter: ({ order }: { order: Order }, _, { user }: { user: User }) =>
            order.driverId === user.id,
        resolve: ({ order }) => order,
    })
    cookedOrders() {
        return this.pubSub.asyncIterator(NEW_COOKED_ORDERS);
    }

    // subscription for all (updates of orders)
    @Role(['Client', 'Owner', 'Delivery'])
    @Subscription((returns) => Order, {
        filter: (
            { order, ownerId }: { order: Order; ownerId: number },
            { id }: { id: number },
            { user }: { user: User },
        ) => {
            if (order.id !== id) return false;
            if (
                (user.role === UserRole.Client &&
                    order.customerId === user.id) ||
                (user.role === UserRole.Owner && ownerId === user.id) ||
                (user.role === UserRole.Delivery && order.driverId === user.id)
            )
                return true;

            return false;
        },
        resolve: ({ order }) => order,
    })
    orderUpdates(@Args() orderUpdateInput: OrderUpdateInput) {
        return this.pubSub.asyncIterator(ORDER_UPDATES);
    }
}
