import {
    ArgsType,
    Field,
    ObjectType,
    PickType,
    registerEnumType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { IsEnum, IsOptional } from 'class-validator';

export enum OrderStatusForDelivery {
    PickedUp = OrderStatus.PickedUp,
    Delivered = OrderStatus.Delivered,
}

registerEnumType(OrderStatusForDelivery, { name: 'OrderStatusForDelivery' });

@ArgsType()
export class EditOrderForDeliveryInput extends PickType(
    Order,
    ['id'],
    ArgsType,
) {
    @Field((type) => OrderStatusForDelivery, {
        nullable: true,
    })
    @IsOptional()
    @IsEnum(OrderStatusForDelivery)
    status?: OrderStatusForDelivery;
}

@ObjectType()
export class EditOrderForDeliveryOutput extends CoreOutput {}
