import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@ArgsType()
export class RestaurantInput extends PickType(Restaurant, ['id'], ArgsType) {}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
    @Field((type) => Restaurant, { nullable: true })
    restaurant?: Restaurant;
}
