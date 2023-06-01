import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { RestaurantsService } from './restaurants.service';
import {
    CategoriesResolver,
    RestaurantsResolver,
} from './restaurants.resolvers';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Category])],
    providers: [
        RestaurantsService,
        RestaurantsResolver,
        CategoriesResolver,
        { provide: 'PER_PAGE', useValue: 5 },
    ],
})
export class RestaurantsModule {}
