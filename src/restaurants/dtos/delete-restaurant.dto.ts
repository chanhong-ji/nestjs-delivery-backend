import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@ArgsType()
export class DeleteRestaurantInput extends PickType(
    Restaurant,
    ['id'],
    ArgsType,
) {}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}
