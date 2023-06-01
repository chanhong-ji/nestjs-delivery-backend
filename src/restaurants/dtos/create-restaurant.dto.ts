import { ArgsType, Field, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';
import { IsNumber } from 'class-validator';

@ArgsType()
export class CreateRestaurantInput extends PickType(
    Restaurant,
    ['name', 'address', 'coverImage'],
    ArgsType,
) {
    @Field((type) => Int)
    @IsNumber()
    categoryId: number;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
