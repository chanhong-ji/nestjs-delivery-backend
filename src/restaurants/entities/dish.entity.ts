import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { IsNumber, IsString, Length, MaxLength } from 'class-validator';
import { Restaurant } from './restaurant.entity';

@ObjectType()
@InputType('dishOption', { isAbstract: true })
export class DishOption {
    @Field((type) => String)
    @Column()
    @IsString()
    name: string;

    @Field((type) => Int, { defaultValue: 0 })
    @Column()
    @IsNumber()
    extra: number;
}

@Entity()
@ObjectType()
@InputType('dish', { isAbstract: true })
export class Dish extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    @Length(2, 30)
    name: string;

    @Field((type) => Int)
    @Column()
    @IsNumber()
    price: number;

    @Field((type) => String)
    @Column()
    @IsString()
    photo: string;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @MaxLength(140)
    description?: string;

    @Field((type) => Restaurant, { nullable: false })
    @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    restaurant: Restaurant;

    @Field((type) => Int)
    @RelationId((dish: Dish) => dish.restaurant)
    restaurantId: number;

    @Field((type) => [DishOption], { nullable: true })
    @Column({ type: 'json', nullable: true })
    dishOptions?: DishOption[];
}
