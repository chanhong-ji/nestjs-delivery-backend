import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { IsNumber } from 'class-validator';
import { PaginationInput, PaginationOutput } from './pagination.dto';

@ArgsType()
export class RestaurantsInput extends PaginationInput {
    @Field((type) => Int)
    @IsNumber()
    categoryId: number;
}

@ObjectType()
export class RestaurantsOutput extends PaginationOutput {
    @Field((type) => [Restaurant], { nullable: true })
    result?: Restaurant[];
}
