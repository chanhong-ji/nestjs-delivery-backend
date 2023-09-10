import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@ArgsType()
export class DishInput extends PickType(Dish, ['id'], ArgsType) {}

@ObjectType()
export class DishOutput extends CoreOutput {
    @Field((type) => Dish, { nullable: true })
    result?: Dish;
}
