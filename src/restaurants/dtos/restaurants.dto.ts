import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { IsNumber } from 'class-validator';
import { PaginationInput, PaginationOutput } from './pagination.dto';

@ArgsType()
export class RestaurantsInput extends PaginationInput {
    @Field((type) => Number)
    @IsNumber()
    categoryId: number;
}

@ObjectType()
export class RestaurantsOutput extends PaginationOutput {
    @Field((type) => [Restaurant])
    result?: Restaurant[];
}
