import { Test, TestingModule } from '@nestjs/testing';
import {
    CategoriesResolver,
    DishesResolver,
    RestaurantsResolver,
} from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';
import { ErrorOutputs } from 'src/common/errors';
import { faker } from '@faker-js/faker';
import { User, UserRole } from 'src/users/entities/users.entity';

describe('Restaurants - Resolver', () => {
    let service: Partial<Record<keyof RestaurantsService, jest.Mock>>;
    let resolver: RestaurantsResolver;
    let categoryResolver: CategoriesResolver;
    let dishResolver: DishesResolver;
    let errors: ErrorOutputs;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RestaurantsResolver,
                CategoriesResolver,
                DishesResolver,
                ErrorOutputs,
                {
                    provide: RestaurantsService,
                    useValue: {
                        findById: jest.fn(),
                        findByIdWithMenu: jest.fn(),
                        findAllByCategory: jest.fn(),
                        search: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                        findAllCategories: jest.fn(),
                        findCategoryById: jest.fn(),
                        findCategoryByName: jest.fn(),
                        createCategory: jest.fn(),
                        countRestaurants: jest.fn(),
                        findDishById: jest.fn(),
                        createDish: jest.fn(),
                        editDish: jest.fn(),
                        deleteDish: jest.fn(),
                    },
                },
                { provide: 'PER_PAGE', useValue: 5 },
            ],
        }).compile();

        resolver = module.get<RestaurantsResolver>(RestaurantsResolver);
        categoryResolver = module.get<CategoriesResolver>(CategoriesResolver);
        dishResolver = module.get<DishesResolver>(DishesResolver);
        service = module.get(RestaurantsService);
        errors = module.get<ErrorOutputs>(ErrorOutputs);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
        expect(categoryResolver).toBeDefined();
        expect(dishResolver).toBeDefined();
    });

    describe('Restaurants - Resolver', () => {
        let user: User;
        beforeEach(() => {
            user = createFakeUser();
        });

        describe('createRestaurant', () => {
            let restaurant: MockRestaurant;
            let inputData: Pick<
                MockRestaurant,
                'name' | 'address' | 'coverImage' | 'categoryId'
            >;

            beforeEach(() => {
                restaurant = createFakeRestaurant();
                inputData = {
                    name: restaurant.name,
                    address: restaurant.address,
                    coverImage: restaurant.coverImage,
                    categoryId: restaurant.categoryId,
                };
            });

            it('return true when restaurant is created', async () => {
                const category = faker.internet.userName();
                service.findCategoryById.mockResolvedValue(category);

                const result = await resolver.createRestaurant(inputData, user);

                expect(result).toEqual({ ok: true });
                expect(service.findCategoryById).toHaveBeenCalledTimes(1);
                expect(service.findCategoryById).toHaveBeenCalledWith(
                    inputData.categoryId,
                );
                expect(service.create).toHaveBeenCalledTimes(1);
                expect(service.create).toHaveBeenCalledWith(user.id, inputData);
            });

            it('return false when category not found', async () => {
                service.findCategoryById.mockResolvedValue(null);

                const result = await resolver.createRestaurant(inputData, user);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.create).not.toHaveBeenCalled();
            });

            it('return false when error occurs in DB', async () => {
                service.findCategoryById.mockRejectedValue(new Error());

                const result = await resolver.createRestaurant(inputData, user);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('editRestaurant', () => {
            let restaurant: MockRestaurant;
            let inputData: Partial<
                Pick<
                    MockRestaurant,
                    'name' | 'address' | 'coverImage' | 'categoryId'
                >
            > & { restaurantId: number; categoryId?: number };

            beforeEach(() => {
                restaurant = createFakeRestaurant();
                inputData = {
                    restaurantId: restaurant.id,
                    name: faker.internet.userName(),
                };
                restaurant.ownerId = user.id;
            });

            it('return ok when restarant is updated', async () => {
                service.findById.mockResolvedValue(restaurant);

                const result = await resolver.editRestaurant(inputData, user);

                expect(result).toEqual({ ok: true });
                expect(service.findById).toHaveBeenCalledTimes(1);
                expect(service.findById).toHaveBeenCalledWith(
                    inputData.restaurantId,
                );
                expect(service.update).toHaveBeenCalledTimes(1);
                expect(service.update).toHaveBeenCalledWith(
                    restaurant,
                    inputData,
                );
            });

            it('return false when restaurnat not found', async () => {
                service.findById.mockResolvedValue(null);

                const result = await resolver.editRestaurant(inputData, user);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.update).not.toHaveBeenCalled();
            });

            it('return false when user is not the owner of restaurant', async () => {
                restaurant.ownerId = user.id + 1;
                service.findById.mockResolvedValue(restaurant);

                const result = await resolver.editRestaurant(inputData, user);

                expect(result).toEqual(errors.notAuthorizedError);
            });

            it('return false when error occurs in DB for update', async () => {
                service.findById.mockResolvedValue(restaurant);
                service.update.mockRejectedValue(new Error());

                const result = await resolver.editRestaurant(inputData, user);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('deleteRestaurant', () => {
            let restaurant: MockRestaurant;
            let inputData: Pick<MockRestaurant, 'id'>;

            beforeEach(() => {
                restaurant = createFakeRestaurant();
                inputData = {
                    id: restaurant.id,
                };
                restaurant.ownerId = user.id;
            });

            it('return true when retaurant is deleted', async () => {
                service.findById.mockResolvedValue(restaurant);

                const result = await resolver.deleteRestaurant(inputData, user);

                expect(result).toEqual({ ok: true });
                expect(service.findById).toHaveBeenCalledTimes(1);
                expect(service.findById).toHaveBeenCalledWith(inputData.id);
                expect(service.delete).toHaveBeenCalledTimes(1);
                expect(service.delete).toHaveBeenCalledWith(inputData.id);
            });

            it('return false when restaurant not found', async () => {
                service.findById.mockResolvedValue(null);

                const result = await resolver.deleteRestaurant(inputData, user);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.delete).not.toHaveBeenCalled();
            });

            it('return false when user is not the owner of restaurant', async () => {
                restaurant.ownerId = user.id + 1;
                service.findById.mockResolvedValue(restaurant);

                const result = await resolver.deleteRestaurant(inputData, user);

                expect(result).toEqual(errors.notAuthorizedError);
                expect(service.delete).not.toHaveBeenCalled();
            });

            it('return false when error occurs in DB for delete', async () => {
                service.findById.mockResolvedValue(restaurant);
                service.delete.mockRejectedValue(new Error());

                const result = await resolver.deleteRestaurant(inputData, user);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('restaurant', () => {
            let restaurant: MockRestaurant;
            let inputData: Pick<MockRestaurant, 'id'>;

            beforeEach(() => {
                restaurant = createFakeRestaurant();
                inputData = {
                    id: restaurant.id,
                };
                restaurant.ownerId = user.id;
            });

            it('return true & restaurant', async () => {
                service.findByIdWithMenu.mockResolvedValue(restaurant);

                const result = await resolver.restaurant(inputData);

                expect(result).toEqual({ ok: true, result: restaurant });
                expect(service.findByIdWithMenu).toBeCalledTimes(1);
                expect(service.findByIdWithMenu).toHaveBeenCalledWith(
                    inputData.id,
                );
            });

            it('return false when restaurant not found', async () => {
                service.findByIdWithMenu.mockResolvedValue(null);

                const result = await resolver.restaurant(inputData);

                expect(result).toEqual(errors.notFoundErrorOutput);
            });

            it('return false when error occurs in DB for findByIdWithMenu', async () => {
                service.findByIdWithMenu.mockRejectedValue(new Error());

                const result = await resolver.restaurant(inputData);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('restaurants', () => {
            let restaurant: MockRestaurant;
            let restaurants: MockRestaurant[];
            let inputData: { categoryId: number; page: number };

            beforeEach(() => {
                restaurant = createFakeRestaurant();
                restaurants = [restaurant];
                inputData = {
                    categoryId: restaurant.categoryId,
                    page: 1,
                };
            });

            it('return true & result & totalItems', async () => {
                const category = { id: inputData.categoryId };
                service.findCategoryById.mockResolvedValue(category);
                service.findAllByCategory.mockResolvedValue([restaurants, 1]);

                const result = await resolver.restaurants(inputData);

                expect(result).toEqual({
                    ok: true,
                    result: restaurants,
                    totalItems: 1,
                    totalPages: 1,
                });
                expect(service.findCategoryById).toHaveBeenCalledTimes(1);
                expect(service.findCategoryById).toHaveBeenCalledWith(
                    inputData.categoryId,
                );
                expect(service.findAllByCategory).toHaveBeenCalledTimes(1);
                expect(service.findAllByCategory).toHaveBeenCalledWith(
                    inputData.categoryId,
                    inputData.page,
                );
            });

            it('return false when category not found', async () => {
                service.findCategoryById.mockResolvedValue(null);

                const result = await resolver.restaurants(inputData);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.findAllByCategory).not.toHaveBeenCalled();
            });

            it('return false when error occurs in DB for findCategoryById', async () => {
                service.findCategoryById.mockRejectedValue(new Error());

                const result = await resolver.restaurants(inputData);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('searchRestaurant', () => {
            let restaurants: MockRestaurant[];
            let inputData: { query: string; page: number };

            beforeEach(() => {
                restaurants = [createFakeRestaurant(), createFakeRestaurant()];
                inputData = {
                    query: faker.internet.domainWord(),
                    page: 1,
                };
            });

            it('return true & restaurants', async () => {
                const totalItems = 1;
                service.search.mockResolvedValue([restaurants, totalItems]);

                const result = await resolver.searchRestaurant(inputData);

                expect(result).toEqual({
                    ok: true,
                    result: restaurants,
                    totalItems,
                    totalPages: 1,
                });
                expect(service.search).toHaveBeenCalledTimes(1);
                expect(service.search).toHaveBeenCalledWith(
                    inputData.query,
                    inputData.page,
                );
            });

            it('return false when error occurs in DB for search', async () => {
                service.search.mockRejectedValue(new Error());

                const result = await resolver.searchRestaurant(inputData);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });
    });

    describe('Categories - Resolver', () => {
        let inputData: Pick<MockCategory, 'name'>;

        beforeEach(() => {
            inputData = {
                name: faker.internet.userName(),
            };
        });

        describe('createCategory', () => {
            it('return true when category is created', async () => {
                service.findCategoryByName.mockResolvedValue(null);

                const result = await categoryResolver.createCategory(inputData);

                expect(result).toEqual({ ok: true });
                expect(service.findCategoryByName).toHaveBeenCalledTimes(1);
                expect(service.findCategoryByName).toHaveBeenCalledWith(
                    inputData.name,
                );
                expect(service.createCategory).toHaveBeenCalledTimes(1);
                expect(service.createCategory).toHaveBeenCalledWith(
                    inputData.name,
                );
            });

            it('return false when category already exists', async () => {
                service.findCategoryByName.mockResolvedValue({});

                const result = await categoryResolver.createCategory(inputData);

                expect(result).toEqual(errors.categoryExistError);
                expect(service.createCategory).not.toHaveBeenCalled();
            });

            it('return false when error occurs in DB for findCategoryByName', async () => {
                service.findCategoryByName.mockRejectedValue(new Error());

                const result = await categoryResolver.createCategory(inputData);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('seeCategories', () => {
            it('return true & categories', async () => {
                const categories = [createFakeCategory()];
                service.findAllCategories.mockResolvedValue(categories);

                const result = await categoryResolver.seeCategories();

                expect(result).toEqual({ ok: true, categories });
                expect(service.findAllCategories).toHaveBeenCalledTimes(1);
            });

            it('return false when error occurs in DB for findAllCategories', async () => {
                service.findAllCategories.mockRejectedValue(new Error());

                const result = await categoryResolver.seeCategories();

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });
    });

    describe('Dishes - Resolver', () => {
        let user: User;
        let restaurant: MockRestaurant;
        let dish: MockDish;

        beforeEach(() => {
            user = createFakeUser();
            restaurant = createFakeRestaurant();
            dish = createFakeDish(restaurant);
            restaurant.ownerId = user.id;
        });

        describe('createDish', () => {
            let inputData: Pick<
                MockDish,
                'restaurantId' | 'name' | 'price' | 'photo' | 'description'
            >;

            beforeEach(() => {
                inputData = {
                    name: dish.name,
                    price: dish.price,
                    photo: dish.photo,
                    restaurantId: dish.restaurantId,
                };
            });
            it('return true when dish is created', async () => {
                service.findById.mockResolvedValue(restaurant);

                const result = await dishResolver.createDish(inputData, user);

                expect(result).toEqual({ ok: true });
                expect(service.findById).toHaveBeenCalledTimes(1);
                expect(service.findById).toHaveBeenCalledWith(
                    inputData.restaurantId,
                );
                expect(service.createDish).toHaveBeenCalledTimes(1);
                expect(service.createDish).toHaveBeenCalledWith(inputData);
            });

            it('return false when restaurant not found', async () => {
                service.findById.mockResolvedValue(null);

                const result = await dishResolver.createDish(inputData, user);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.createDish).not.toHaveBeenCalled();
            });

            it('return false when is not the owner of the restaurant', async () => {
                restaurant.ownerId = user.id + 1;
                service.findById.mockResolvedValue(restaurant);

                const result = await dishResolver.createDish(inputData, user);

                expect(result).toEqual(errors.notAuthorizedError);
            });

            it('return false when error occurs in DB for findById', async () => {
                service.findById.mockRejectedValue(new Error());

                const result = await dishResolver.createDish(inputData, user);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('editDish', () => {
            let inputDate: Partial<
                Pick<MockDish, 'price' | 'name' | 'photo' | 'dishOptions'>
            > & { id: number };

            beforeEach(() => {
                inputDate = {
                    id: dish.id,
                    name: faker.internet.userName(),
                    price: faker.number.int({ min: 1000, max: 100000 }),
                };
            });

            it('return true when dish is edited', async () => {
                service.findDishById.mockResolvedValue(dish);

                const result = await dishResolver.editDish(inputDate, user);

                expect(result).toEqual({ ok: true });
                expect(service.findDishById).toHaveBeenCalledTimes(1);
                expect(service.findDishById).toHaveBeenCalledWith(inputDate.id);
                expect(service.editDish).toHaveBeenCalledTimes(1);
                expect(service.editDish).toHaveBeenCalledWith(dish, inputDate);
            });

            it('return false when dish is not found', async () => {
                service.findDishById.mockResolvedValue(null);

                const result = await dishResolver.editDish(inputDate, user);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.editDish).not.toHaveBeenCalled();
            });

            it('return false when user is not the owner of the restaurant', async () => {
                dish.restaurant.ownerId = user.id + 1;
                service.findDishById.mockResolvedValue(dish);

                const result = await dishResolver.editDish(inputDate, user);

                expect(result).toEqual(errors.notAuthorizedError);
                expect(service.editDish).not.toHaveBeenCalled();
            });

            it('return false when error occrus in DB for findDishById', async () => {
                service.findDishById.mockRejectedValue(new Error());

                const result = await dishResolver.editDish(inputDate, user);

                expect(result).toEqual(errors.dbErrorOutput);
            });
        });

        describe('deleteDish', () => {
            let inputData: Pick<MockDish, 'id'>;

            beforeEach(() => {
                inputData = {
                    id: dish.id,
                };
            });

            it('return true when dish is deleted', async () => {
                service.findDishById.mockResolvedValue(dish);

                const result = await dishResolver.deleteDish(inputData, user);

                expect(result).toEqual({ ok: true });
                expect(service.findDishById).toHaveBeenCalledTimes(1);
                expect(service.findDishById).toHaveBeenCalledWith(inputData.id);
                expect(service.deleteDish).toHaveBeenCalledTimes(1);
                expect(service.deleteDish).toHaveBeenCalledWith(inputData.id);
            });

            it('return false when dish is not found', async () => {
                service.findDishById.mockResolvedValue(null);

                const result = await dishResolver.deleteDish(inputData, user);

                expect(result).toEqual(errors.notFoundErrorOutput);
                expect(service.deleteDish).not.toHaveBeenCalled();
            });

            it('return false when user is not the owner of the restaurant', async () => {
                dish.restaurant.ownerId = user.id + 1;
                service.findDishById.mockResolvedValue(dish);

                const result = await dishResolver.deleteDish(inputData, user);

                expect(result).toEqual(errors.notAuthorizedError);
                expect(service.deleteDish).not.toHaveBeenCalled();
            });

            it('return false when error occurs in DB for findDishById', async () => {
                service.findDishById.mockRejectedValue(new Error());

                const result = await dishResolver.deleteDish(inputData, user);

                expect(result).toEqual(errors.dbErrorOutput);
            });
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

type MockCategory = {
    id: number;
    name: string;
    restaurants: [];
};

type MockDish = {
    id: number;
    name: string;
    price: number;
    photo: string;
    description?: string;
    restaurant: MockRestaurant;
    restaurantId: number;
    dishOptions?: [];
};

const createFakeRestaurant = (): MockRestaurant => ({
    id: faker.number.int(),
    name: faker.internet.userName(),
    address: faker.location.streetAddress(),
    coverImage: faker.string.alpha(),
    categoryId: faker.number.int(),
    ownerId: faker.number.int(),
});

const createFakeCategory = (): MockCategory => ({
    id: faker.number.int(),
    name: faker.internet.userName(),
    restaurants: [],
});

const createFakeDish = (restaurant: MockRestaurant): MockDish => ({
    id: faker.number.int(),
    name: faker.internet.userName(),
    price: faker.number.int({ min: 1000, max: 100000 }),
    photo: faker.string.alpha(),
    restaurant,
    restaurantId: restaurant.id,
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
    getHashedPassword: jest.fn(),
    updatedAt: new Date(),
    createdAt: new Date(),
    saveOriginPassword: jest.fn(),
});
