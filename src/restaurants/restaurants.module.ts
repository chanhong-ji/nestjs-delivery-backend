import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { RestaurantsService } from './restaurants.service';
import {
    CategoriesResolver,
    DishesResolver,
    RestaurantsResolver,
} from './restaurants.resolvers';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
    providers: [
        RestaurantsService,
        RestaurantsResolver,
        CategoriesResolver,
        DishesResolver,
        { provide: 'PER_PAGE', useValue: 5 },
    ],
})
export class RestaurantsModule {}
