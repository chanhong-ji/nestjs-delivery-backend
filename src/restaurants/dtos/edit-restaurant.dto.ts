import { ArgsType, Field, Int, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { IsNumber } from 'class-validator';
import { CreateRestaurantInput } from './create-restaurant.dto';

@ArgsType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
    @Field((type) => Int)
    @IsNumber()
    restaurantId: number;

    @Field((type) => Int, { nullable: true })
    @IsNumber()
    categoryId?: number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
