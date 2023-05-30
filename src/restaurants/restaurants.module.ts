import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsResolver } from './restaurants.resolvers';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Category])],
    providers: [RestaurantsService, RestaurantsResolver],
})
export class RestaurantsModule {}
