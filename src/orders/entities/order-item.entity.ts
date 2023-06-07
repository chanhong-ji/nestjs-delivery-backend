import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish, DishOption } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('orderItemOption')
@ObjectType()
export class OrderItemOption extends PickType(
    DishOption,
    ['name'],
    InputType,
) {}

@Entity()
@ObjectType()
@InputType('orderItem', { isAbstract: true })
export class OrderItem extends CoreEntity {
    @Field((type) => Dish)
    @ManyToOne((type) => Dish)
    dish: Dish;

    @Field((type) => [OrderItemOption], { nullable: true })
    @Column({ type: 'json', nullable: true })
    choices?: OrderItemOption[];
}
