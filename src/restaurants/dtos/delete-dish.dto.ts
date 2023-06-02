import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@ArgsType()
export class DeleteDishInput extends PickType(Dish, ['id'], ArgsType) {}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
