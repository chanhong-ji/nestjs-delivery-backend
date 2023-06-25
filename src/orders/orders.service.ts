import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from 'src/users/entities/users.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderInput } from './dtos/create-order.dto';
import { UserRole } from 'src/users/entities/users.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly repo: Repository<Order>,
        @InjectRepository(Dish) private readonly dishRepo: Repository<Dish>,
        @InjectRepository(Restaurant)
        private readonly restRepo: Repository<Restaurant>,
        @InjectRepository(OrderItem)
        private readonly itemRepo: Repository<OrderItem>,
        @Inject('PER_PAGE') private readonly PER_PAGE,
    ) {}

    // Order

    async findById(id: number): Promise<Order | null> {
        return this.repo.findOne({
            where: { id },
            relations: {
                restaurant: true,
            },
        });
    }

    async findByIdWithDetail(id: number): Promise<Order | null> {
        return this.repo.findOne({
            where: { id },
            relations: {
                restaurant: true,
                customer: true,
                driver: true,
                items: {
                    dish: true,
                },
            },
            select: {
                driver: {
                    id: true,
                    email: true,
                },
                customer: {
                    id: true,
                    email: true,
                },
                items: {
                    id: true,
                    choices: true,
                    dish: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
            },
        });
    }

    async findAllByStatus(
        user: User,
        page: number,
        status: OrderStatus,
    ): Promise<[Order[], number]> {
        let whereOption;

        if (user.role === UserRole.Client) {
            whereOption = { customer: { id: user.id } };
        } else if (user.role === UserRole.Delivery) {
            whereOption = { driver: { id: user.id } };
        } else if (user.role === UserRole.Owner) {
            whereOption = { restaurant: { owner: { id: user.id } } };
        }

        return this.repo.findAndCount({
            where: {
                ...(status && { status }),
                ...whereOption,
            },
            loadRelationIds: true,
            skip: this.PER_PAGE * (page - 1),
            take: this.PER_PAGE,
        });
    }

    async create(user: User, data: CreateOrderInput): Promise<Order> {
        const orderItems: OrderItem[] = [];
        for (const item of data.items) {
            const orderItem = await this.itemRepo.save(
                this.itemRepo.create({
                    dish: { id: item.dishId },
                    choices: item.choices,
                }),
            );
            orderItems.push(orderItem);
        }

        return this.repo.save(
            this.repo.create({
                restaurant: { id: data.restaurantId },
                customer: { id: user.id },
                items: orderItems,
                total: data.total,
                address: data.address,
            }),
        );
    }

    // Dish

    async findDishById(id: number): Promise<Dish> {
        return this.dishRepo.findOne({
            where: { id },
        });
    }

    // Restaurant

    async findRestById(id: number): Promise<Restaurant> {
        return this.restRepo.findOne({ where: { id } });
    }

    // Order Status

    async editOrder(order: Order, status: OrderStatus) {
        return this.repo.update(order.id, { status });
    }

    async cancelOrder(order: Order): Promise<void> {
        await this.repo.delete(order.id);
    }

    async assignDriver(order: Order, driverId: number): Promise<void> {
        await this.repo.update(order.id, { driver: { id: driverId } });
    }
}
