import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    PickType,
} from '@nestjs/graphql';
import { IsNumber, IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { OrderItem } from '../entities/order-item.entity';

@InputType('createOrderItemInput')
class CreateOrderItemInput extends PickType(OrderItem, ['choices'], InputType) {
    @Field((type) => Int)
    @IsNumber()
    dishId: number;
}

@ArgsType()
export class CreateOrderInput {
    @Field((type) => Int)
    @IsNumber()
    restaurantId: number;

    @Field((type) => [CreateOrderItemInput], { nullable: false })
    items: CreateOrderItemInput[];

    @Field((type) => Int, { nullable: true })
    total?: number;

    @Field((type) => String)
    @IsString()
    address: string;
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
