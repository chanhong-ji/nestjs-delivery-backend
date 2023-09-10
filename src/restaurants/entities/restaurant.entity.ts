import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { IsOptional, IsString } from 'class-validator';
import { User } from 'src/users/entities/users.entity';
import { Dish } from './dish.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity()
@ObjectType()
@InputType('restaurant', { isAbstract: true })
export class Restaurant extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    name: string;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    coverImage?: string;

    @Field((type) => String)
    @Column()
    @IsString()
    address: string;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    dongCode?: string;

    @Field((type) => Category, { nullable: true })
    @ManyToOne((type) => Category, (category) => category.restaurants, {
        nullable: false,
        onDelete: 'NO ACTION',
    })
    category: Category;

    @RelationId((restaurant: Restaurant) => restaurant.category)
    categoryId?: number;

    @Field((type) => User, { nullable: false })
    @ManyToOne((type) => User, (user) => user.restaurants, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    owner: User;

    @Field((type) => Int, { nullable: false })
    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number;

    @Field((type) => [Dish])
    @OneToMany((type) => Dish, (dish) => dish.restaurant)
    menu: Dish[];

    @OneToMany((type) => Order, (order) => order.restaurant)
    orders: Order[];
}
