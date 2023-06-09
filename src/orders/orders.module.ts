import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { Order } from './entities/order.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Category } from 'src/restaurants/entities/category.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from 'src/users/entities/users.entity';
import { ErrorOutputs } from 'src/common/errors';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            Restaurant,
            Category,
            Dish,
            OrderItem,
            User,
        ]),
    ],
    providers: [
        OrdersService,
        OrdersResolver,
        { provide: 'PER_PAGE', useValue: 10 },
        ErrorOutputs,
    ],
})
export class OrdersModule {}
