import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@ArgsType()
export class MyRestaurantInput extends PickType(Restaurant, ['id'], ArgsType) {}

@ObjectType()
export class MyRestaurantOutput extends CoreOutput {
    @Field((type) => Restaurant, { nullable: true })
    result?: Restaurant;
}
