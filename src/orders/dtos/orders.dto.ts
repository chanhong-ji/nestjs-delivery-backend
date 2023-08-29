import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { Order, OrderStatus } from '../entities/order.entity';
import {
    PaginationInput,
    PaginationOutput,
} from 'src/restaurants/dtos/pagination.dto';

@ArgsType()
export class OrdersInput extends PaginationInput {
    @Field((type) => OrderStatus, { nullable: true })
    status?: OrderStatus;
}

@ObjectType()
export class OrdersOutput extends PaginationOutput {
    @Field((type) => [Order], { nullable: true })
    result?: Order[];
}
