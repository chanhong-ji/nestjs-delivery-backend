import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { ErrorOutputs } from 'src/common/errors';
import { User, UserRole } from 'src/users/entities/users.entity';
import { OrderStatus } from './entities/order.entity';
import { DishOption } from 'src/restaurants/entities/dish.entity';
import { CreateOrderItemInput } from './dtos/create-order.dto';

describe('Orders - Resolver', () => {
    let resolver: OrdersResolver;
    let service: Partial<Record<keyof OrdersService, jest.Mock>>;
    let errors: ErrorOutputs;
    let perPage: number;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersResolver,
                ErrorOutputs,
                {
                    provide: OrdersService,
                    useValue: {
                        findById: jest.fn(),
                        findByIdForValidation: jest.fn(),
                        findByIdForOwner: jest.fn(),
                        findByIdForClient: jest.fn(),
                        findAllByStatus: jest.fn(),
                        create: jest.fn(),
                        findDishById: jest.fn(),
                        findRestById: jest.fn(),
                        pendingToCooking: jest.fn(),
                        cookingToPickedUp: jest.fn(),
                        pickedUpToDelivered: jest.fn(),
                        cancelOrder: jest.fn(),
                        findDriverById: jest.fn(),
                    },
                },
                { provide: 'PER_PAGE', useValue: 10 },
            ],
        }).compile();

        resolver = module.get<OrdersResolver>(OrdersResolver);
        service = module.get(OrdersService);
        errors = module.get(ErrorOutputs);
        perPage = module.get('PER_PAGE');
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    let owner: User;
    let customer: User;
    let restaurant: MockRestaurant;
    let dishes: MockDish[];

    beforeEach(() => {
        owner = createFakeUser();
        owner.role = UserRole.Owner;
        customer = createFakeUser();
        restaurant = createFakeRestaurant();
        restaurant.ownerId = owner.id;
        dishes = [createFakeDish(restaurant), createFakeDish(restaurant)];
    });

    describe('createOrder', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'restaurantId' | 'address' | 'total'> & {
            items: CreateOrderItemInput[];
        };

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            // create an order which order the dishes
            inputData = {
                restaurantId: order.restaurantId,
                address: order.address,
                items: dishes.map((dish) => ({
                    dishId: dish.id,
                    choices: dish.dishOptions.map((option) => ({
                        name: option.name,
                    })),
                })),
            };
        });

        it('return true when order is created', async () => {
            service.findRestById.mockResolvedValue(restaurant);
            service.findDishById.mockResolvedValueOnce(dishes[0]);
            service.findDishById.mockResolvedValueOnce(dishes[1]);
            let total = 0;
            for (const dish of [dishes[0], dishes[1]]) {
                total += dish.price;
                dish.dishOptions.forEach((option) => {
                    total += option.extra;
                });
            }

            const result = await resolver.createOrder(inputData, customer);

            expect(result).toEqual({ ok: true });
            expect(service.findRestById).toHaveBeenCalledTimes(1);
            expect(service.findRestById).toHaveBeenCalledWith(
                inputData.restaurantId,
            );
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(service.create).toHaveBeenCalledWith(customer, inputData);
            expect(inputData.total).toBe(total);
        });

        it('return false when item(dish) not found', async () => {
            service.findRestById.mockResolvedValue(restaurant);
            service.findDishById.mockResolvedValue(null);

            const result = await resolver.createOrder(inputData, customer);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.create).not.toHaveBeenCalled();
        });

        it('return false when dish options not found', async () => {
            inputData.items[0].choices[0].name += 'extra';
            service.findRestById.mockResolvedValue(restaurant);
            service.findDishById.mockResolvedValueOnce(dishes[0]);
            service.findDishById.mockResolvedValueOnce(dishes[1]);

            const result = await resolver.createOrder(inputData, customer);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.create).not.toHaveBeenCalled();
        });

        it('return false when error occurs in DB for findDishById', async () => {
            service.findRestById.mockRejectedValue(new Error());

            const result = await resolver.createOrder(inputData, customer);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });

    describe('takeOrder', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'id'>;

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            inputData = { id: order.id };
        });

        it('return true when status of order is changed from pending to cooking', async () => {
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.takeOrder(inputData, owner);

            expect(result).toEqual({ ok: true });
            expect(service.findByIdForValidation).toHaveBeenCalledTimes(1);
            expect(service.findByIdForValidation).toHaveBeenCalledWith(
                inputData.id,
            );
            expect(service.pendingToCooking).toHaveBeenCalledTimes(1);
            expect(service.pendingToCooking).toHaveBeenCalledWith(order);
        });

        it('return false when order not found', async () => {
            service.findByIdForValidation.mockResolvedValue(null);

            const result = await resolver.takeOrder(inputData, owner);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.pendingToCooking).not.toHaveBeenCalled();
        });

        it('return false when user is not the owner of restaurant of order', async () => {
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.takeOrder(inputData, customer);

            expect(result).toEqual(errors.notAuthorizedError);
            expect(service.pendingToCooking).not.toHaveBeenCalled();
        });

        it('return false when the order status is not on pending', async () => {
            order.status = OrderStatus.Cooking;
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.takeOrder(inputData, owner);

            expect(result).toEqual(errors.wrongAccessError);
        });

        it('return false when error occurs in DB ', async () => {
            service.findByIdForValidation.mockRejectedValue(new Error());

            const result = await resolver.takeOrder(inputData, owner);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });

    describe('pickUpOrder', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'id' | 'driverId'>;
        let driver: User;

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            order.status = OrderStatus.Cooking;
            driver = createFakeUser();
            inputData = { id: order.id, driverId: driver.id };
        });

        it('return true when status of order is changed from cooking to pickedUp', async () => {
            service.findByIdForValidation.mockResolvedValue(order);
            service.findDriverById.mockResolvedValue(driver);

            const result = await resolver.pickUpOrder(inputData, owner);

            expect(result).toEqual({ ok: true });
            expect(service.findByIdForValidation).toHaveBeenCalledTimes(1);
            expect(service.findByIdForValidation).toHaveBeenCalledWith(
                inputData.id,
            );
            expect(service.findDriverById).toHaveBeenCalledTimes(1);
            expect(service.findDriverById).toHaveBeenCalledWith(
                inputData.driverId,
            );
            expect(service.cookingToPickedUp).toHaveBeenCalledTimes(1);
            expect(service.cookingToPickedUp).toHaveBeenCalledWith(
                order,
                inputData.driverId,
            );
        });

        it('return false when order not found', async () => {
            service.findByIdForValidation.mockResolvedValue(null);

            const result = await resolver.pickUpOrder(inputData, owner);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.findDriverById).not.toHaveBeenCalled();
        });

        it('return false when user is not the owner of restaurant of the order', async () => {
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.pickUpOrder(inputData, customer);

            expect(result).toEqual(errors.notAuthorizedError);
            expect(service.findDriverById).not.toHaveBeenCalled();
        });

        it('return false when status of order is not cooking', async () => {
            order.status = OrderStatus.Delivered;
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.pickUpOrder(inputData, owner);

            expect(result).toEqual(errors.wrongAccessError);
        });

        it('return false when driver not found', async () => {
            service.findByIdForValidation.mockResolvedValue(order);
            service.findDriverById.mockResolvedValue(null);

            const result = await resolver.pickUpOrder(inputData, owner);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.cookingToPickedUp).not.toHaveBeenCalled();
        });

        it('return fasle when error occurs in DB', async () => {
            service.findByIdForValidation.mockRejectedValue(new Error());

            const result = await resolver.pickUpOrder(inputData, owner);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });

    describe('deliveredOrder', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'id'>;
        let driver: User;

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            order.status = OrderStatus.PickedUp;
            driver = createFakeUser();
            order.driverId = driver.id;
            inputData = { id: order.id };
        });

        it('return true when status of order is changed from pickedUp to delivered', async () => {
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.deliveredOrder(inputData, driver);

            expect(result).toEqual({ ok: true });
            expect(service.findByIdForValidation).toHaveBeenCalledTimes(1);
            expect(service.findByIdForValidation).toHaveBeenCalledWith(
                inputData.id,
            );
            expect(service.pickedUpToDelivered).toHaveBeenCalledTimes(1);
            expect(service.pickedUpToDelivered).toHaveBeenCalledWith(order);
        });

        it('return false when order not found', async () => {
            service.findByIdForValidation.mockResolvedValue(null);

            const result = await resolver.deliveredOrder(inputData, driver);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.pickedUpToDelivered).not.toHaveBeenCalled();
        });

        it('return false when user is not the driver of the order', async () => {
            order.driverId = driver.id + 1;
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.deliveredOrder(inputData, driver);

            expect(result).toEqual(errors.notAuthorizedError);
            expect(service.pickedUpToDelivered).not.toHaveBeenCalled();
        });

        it('return false when order status is not on pickedUp', async () => {
            order.status = OrderStatus.Delivered;
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.deliveredOrder(inputData, driver);

            expect(result).toEqual(errors.wrongAccessError);
        });

        it('return false when error occurs in DB', async () => {
            service.findByIdForValidation.mockRejectedValue(new Error());

            const result = await resolver.deliveredOrder(inputData, driver);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });
    describe('cancelOrder', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'id'>;

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            inputData = { id: order.id };
        });

        describe('Role - Client', () => {
            it('return true when order is canceled', async () => {
                service.findByIdForValidation.mockResolvedValue(order);

                const result = await resolver.cancelOrder(inputData, customer);

                expect(result).toEqual({ ok: true });
                expect(service.findByIdForValidation).toHaveBeenCalledTimes(1);
                expect(service.findByIdForValidation).toHaveBeenCalledWith(
                    inputData.id,
                );
                expect(service.cancelOrder).toHaveBeenCalledTimes(1);
                expect(service.cancelOrder).toHaveBeenCalledWith(order);
            });

            it('return false when user is not the customer of order', async () => {
                order.customerId = customer.id + 1;
                service.findByIdForValidation.mockResolvedValue(order);

                const result = await resolver.cancelOrder(inputData, customer);

                expect(result).toEqual(errors.notAuthorizedError);
                expect(service.cancelOrder).not.toHaveBeenCalled();
            });
        });

        describe('Role - Owner', () => {
            it('return true when order is canceled', async () => {
                service.findByIdForValidation.mockResolvedValue(order);

                const result = await resolver.cancelOrder(inputData, owner);

                expect(result).toEqual({ ok: true });
                expect(service.findByIdForValidation).toHaveBeenCalledTimes(1);
                expect(service.findByIdForValidation).toHaveBeenCalledWith(
                    inputData.id,
                );
                expect(service.cancelOrder).toHaveBeenCalledTimes(1);
                expect(service.cancelOrder).toHaveBeenCalledWith(order);
            });

            it('return false when user is not the owner of the restaurant of order', async () => {
                order.restaurant.ownerId = owner.id + 1;
                service.findByIdForValidation.mockResolvedValue(order);

                const result = await resolver.cancelOrder(inputData, owner);

                expect(result).toEqual(errors.notAuthorizedError);
                expect(service.cancelOrder).not.toHaveBeenCalled();
            });
        });

        it('return false when the status of order is not on pending', async () => {
            order.status = OrderStatus.Cooking;
            service.findByIdForValidation.mockResolvedValue(order);

            const result = await resolver.cancelOrder(inputData, customer);

            expect(result).toEqual(errors.wrongAccessError);
            expect(service.cancelOrder).not.toHaveBeenCalled();
        });

        it('return false when error occurs in DB', async () => {
            service.findByIdForValidation.mockRejectedValue(new Error());

            const result = await resolver.cancelOrder(inputData, customer);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });

    describe('order', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'id'>;
        let driver: User;

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            driver = createFakeUser();
            driver.role = UserRole.Delivery;
            order.driverId = driver.id;
            inputData = { id: order.id };
        });

        it('return true and result when user is the customer', async () => {
            service.findByIdForValidation.mockResolvedValue(order);
            service.findByIdForClient.mockResolvedValue(order);

            const result = await resolver.order(inputData, customer);

            expect(result).toEqual({ ok: true, result: order });
            expect(service.findByIdForClient).toHaveBeenCalledTimes(1);
            expect(service.findByIdForClient).toHaveBeenCalledWith(
                inputData.id,
            );
            expect(service.findById).not.toHaveBeenCalled();
            expect(service.findByIdForOwner).not.toHaveBeenCalled();
        });

        it('return true and result when user is the driver', async () => {
            service.findByIdForValidation.mockResolvedValue(order);
            service.findById.mockResolvedValue(order);

            const result = await resolver.order(inputData, driver);

            expect(result).toEqual({ ok: true, result: order });
            expect(service.findById).toHaveBeenCalledWith(inputData.id);
            expect(service.findById).toHaveBeenCalledTimes(1);
            expect(service.findByIdForClient).not.toHaveBeenCalled();
            expect(service.findByIdForOwner).not.toHaveBeenCalled();
        });

        it('return true and result when user is the owner', async () => {
            service.findByIdForValidation.mockResolvedValue(order);
            service.findByIdForOwner.mockResolvedValue(order);

            const result = await resolver.order(inputData, owner);

            expect(result).toEqual({ ok: true, result: order });
            expect(service.findByIdForOwner).toHaveBeenCalledWith(inputData.id);
            expect(service.findByIdForOwner).toHaveBeenCalledTimes(1);
            expect(service.findById).not.toHaveBeenCalled();
            expect(service.findByIdForClient).not.toHaveBeenCalled();
        });

        it('return false when order not found', async () => {
            service.findByIdForValidation.mockResolvedValue(null);

            const result = await resolver.order(inputData, customer);

            expect(result).toEqual(errors.notFoundErrorOutput);
            expect(service.findByIdForClient).not.toHaveBeenCalled();
            expect(service.findById).not.toHaveBeenCalled();
            expect(service.findByIdForOwner).not.toHaveBeenCalled();
        });

        it('return false when user is not authorized', async () => {
            service.findByIdForValidation.mockResolvedValue(order);
            customer.id = order.customerId + 1;

            const result = await resolver.order(inputData, customer);

            expect(result).toEqual(errors.notAuthorizedError);
            expect(service.findByIdForClient).not.toHaveBeenCalled();
            expect(service.findById).not.toHaveBeenCalled();
            expect(service.findByIdForOwner).not.toHaveBeenCalled();
        });

        it('return false when error occurs in DB', async () => {
            service.findByIdForValidation.mockRejectedValue(new Error());

            const result = await resolver.order(inputData, customer);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });

    describe('orders', () => {
        let order: MockOrder;
        let inputData: Pick<MockOrder, 'status'> & { page: number };

        beforeEach(() => {
            order = createFakeOrder(customer, restaurant);
            inputData = { status: null, page: faker.number.int() };
        });

        it('return true and [Order[], number]', async () => {
            const count = faker.number.int();
            const orders = [order];
            service.findAllByStatus.mockResolvedValue([orders, count]);

            const result = await resolver.orders(inputData, customer);

            expect(result).toEqual({
                ok: true,
                result: orders,
                totalItems: count,
                totalPages: Math.ceil(count / perPage),
            });
            expect(service.findAllByStatus).toHaveBeenCalledTimes(1);
            expect(service.findAllByStatus).toHaveBeenCalledWith(
                customer,
                inputData.page,
                inputData.status,
            );
        });

        it('return false when error occurs in DB', async () => {
            service.findAllByStatus.mockRejectedValue(new Error());

            const result = await resolver.orders(inputData, customer);

            expect(result).toEqual(errors.dbErrorOutput);
        });
    });
});

type MockRestaurant = {
    id: number;
    name: string;
    address: string;
    coverImage: string;
    categoryId: number;
    ownerId: number;
};

type MockDish = {
    id: number;
    name: string;
    price: number;
    photo: string;
    description?: string;
    restaurant: MockRestaurant;
    restaurantId: number;
    dishOptions?: DishOption[];
};

type MockOrder = {
    id: number;
    customer: User;
    customerId: number;
    driver?: User;
    driverId: number;
    restaurant: MockRestaurant;
    restaurantId: number;
    items: Array<MockOrderItem>;
    total?: number;
    status: OrderStatus;
    address: string;
};

type MockOrderItem = {
    dish: MockDish;
    choices: Array<{ name: string }>;
};

const createFakeRestaurant = (): MockRestaurant => ({
    id: faker.number.int(),
    name: faker.internet.userName(),
    address: faker.location.streetAddress(),
    coverImage: faker.string.alpha(),
    categoryId: faker.number.int(),
    ownerId: faker.number.int(),
});

const createFakeDish = (restaurant: MockRestaurant): MockDish => ({
    id: faker.number.int(),
    name: faker.internet.userName(),
    price: faker.number.int({ min: 1000, max: 100000 }),
    photo: faker.string.alpha(),
    restaurant,
    restaurantId: restaurant.id,
    dishOptions: [
        {
            name: faker.internet.userName(),
            extra: faker.number.int({ min: 0, max: 3000 }),
        },
        {
            name: faker.internet.userName(),
            extra: faker.number.int({ min: 0, max: 3000 }),
        },
    ],
});

const createFakeUser = (): User => ({
    id: faker.number.int(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: UserRole.Client,
    verified: false,
    restaurants: [],
    orders: [],
    rides: [],
    checkPassword: jest.fn(),
    hashPassword: jest.fn(),
    updatedAt: new Date(),
    createdAt: new Date(),
    saveOriginPassword: jest.fn(),
});

const createFakeOrder = (
    customer: User,
    restaurant: MockRestaurant,
): MockOrder => ({
    id: faker.number.int(),
    customer,
    customerId: customer.id,
    driver: null,
    driverId: null,
    restaurant,
    restaurantId: restaurant.id,
    items: [],
    total: faker.number.int(),
    status: OrderStatus.Pending,
    address: faker.string.alpha(),
});
