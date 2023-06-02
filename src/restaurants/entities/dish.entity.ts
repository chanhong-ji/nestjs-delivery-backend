import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { IsNumber, IsString, Length } from 'class-validator';

@ObjectType()
@InputType('dishChoice', { isAbstract: true })
class DishChoice {
    @Field((type) => String)
    @Column()
    @IsString()
    name: string;

    @Field((type) => Int)
    @Column()
    @IsNumber()
    extra: number;
}

@ObjectType()
@InputType('dishOption', { isAbstract: true })
class DishOption {
    @Field((type) => String)
    @Column()
    @IsString()
    name: string;

    @Field((type) => [DishChoice], { nullable: true })
    @Column({ type: 'json', nullable: true })
    choices?: DishChoice[];

    @Field((type) => Int, { nullable: true })
    @Column({ nullable: true })
    @IsNumber()
    extra?: number;
}

@Entity()
@ObjectType()
export class Dish extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field((type) => Int)
    @Column()
    @IsNumber()
    price: number;

    @Field((type) => String)
    @Column()
    @IsString()
    photo: string;

    @Field((type) => String)
    @Column()
    @IsString()
    @Length(5, 140)
    description: string;

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
