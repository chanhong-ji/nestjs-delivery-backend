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
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @Inject('PER_PAGE') private readonly PER_PAGE,
    ) {}

    // Order
    async findById(id: number): Promise<Order | null> {
        return this.repo.findOne({
            where: { id },
            loadRelationIds: true,
        });
    }

    async findByIdForValidation(id: number): Promise<Order | null> {
        return this.repo.findOne({
            where: { id },
            relations: ['restaurant'],
        });
    }

    async findByIdForOwner(id: number): Promise<Order | null> {
        return this.repo.findOne({
            where: { id },
            relations: {
                driver: true,
                items: {
                    dish: true,
                },
            },
        });
    }

    async findByIdForClient(id: number): Promise<Order | null> {
        return this.repo.findOne({
            where: { id },
            relations: {
                items: {
                    dish: true,
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

    async create(user: User, data: CreateOrderInput): Promise<void> {
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

        await this.repo.save(
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

    async pendingToCooking(order: Order): Promise<void> {
        this.repo.save({ ...order, status: OrderStatus.Cooking });
    }

    async cookingToPickedUp(order: Order, driverId: number): Promise<void> {
        this.repo.save({
            ...order,
            status: OrderStatus.PickedUp,
            driver: { id: driverId },
        });
    }

    async pickedUpToDelivered(order: Order): Promise<void> {
        this.repo.save({ ...order, status: OrderStatus.Delivered });
    }

    async cancelOrder(order: Order): Promise<void> {
        this.repo.delete(order.id);
    }

    // User

    async findUserById(id: number): Promise<User> {
        return this.userRepo.findOne({ where: { id } });
    }
}
