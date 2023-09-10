import {
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    RelationId,
} from 'typeorm';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/users.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
    Pending = 'Pending',
    Cooking = 'Cooking',
    Cooked = 'Cooked',
    PickedUp = 'PickedUp',
    Delivered = 'Delivered',
    Canceled = 'Canceled',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@Entity()
@ObjectType()
@InputType('order', { isAbstract: true })
export class Order extends CoreEntity {
    @Field((type) => User, { nullable: true })
    @ManyToOne((type) => User, (user) => user.orders, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    customer?: User;

    @RelationId((order: Order) => order.customer)
    @Field((type) => Int)
    customerId: number;

    @Field((type) => User, { nullable: true })
    @ManyToOne((type) => User, (user) => user.rides, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    driver?: User;

    @RelationId((order: Order) => order.driver)
    @Field((type) => Int, { nullable: true })
    @IsNumber()
    driverId?: number;

    @Field((type) => Restaurant, { nullable: true })
    @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    restaurant: Restaurant;

    @RelationId((order: Order) => order.restaurant)
    @Field((type) => Int)
    restaurantId: number;

    @Field((type) => [OrderItem])
    @ManyToMany((type) => OrderItem, { nullable: false })
    @IsArray()
    @JoinTable()
    items: OrderItem[];

    @Field((type) => Int)
    @Column()
    total: number;

    @Field((type) => OrderStatus, { defaultValue: OrderStatus.Pending })
    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @Field((type) => String)
    @Column()
    @IsString()
    address: String;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    dongCode?: string;
}
