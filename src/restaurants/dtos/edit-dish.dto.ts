import {
    ArgsType,
    Field,
    Int,
    ObjectType,
    PartialType,
    PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';
import { IsNumber } from 'class-validator';

@ArgsType()
export class EditDishInput extends PartialType(
    PickType(Dish, ['price', 'name', 'photo', 'description', 'dishOptions']),
    ArgsType,
) {
    @Field((type) => Int)
    @IsNumber()
    id: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
