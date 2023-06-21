import {
    ArgsType,
    Field,
    ObjectType,
    PickType,
    registerEnumType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { IsEnum } from 'class-validator';

export enum OrderStatusForOwner {
    Cooking = OrderStatus.Cooking,
    Cooked = OrderStatus.Cooked,
}

registerEnumType(OrderStatusForOwner, { name: 'OrderStatusForOwner' });

@ArgsType()
export class EditOrderForOwnerInput extends PickType(Order, ['id'], ArgsType) {
    @Field((type) => OrderStatusForOwner)
    @IsEnum(OrderStatusForOwner)
    status: OrderStatusForOwner;
}

@ObjectType()
export class EditOrderForOwnerOutput extends CoreOutput {}
