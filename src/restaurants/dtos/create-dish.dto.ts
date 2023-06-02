import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@ArgsType()
export class CreateDishInput extends PickType(
    Dish,
    ['restaurantId', 'name', 'price', 'photo', 'description', 'dishOptions'],
    ArgsType,
) {}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
