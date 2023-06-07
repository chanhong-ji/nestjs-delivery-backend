import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entities/order.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class OrderInput extends PickType(Order, ['id'], ArgsType) {}

@ObjectType()
export class OrderOutput extends CoreOutput {
    @Field((type) => Order, { nullable: true })
    result?: Order;
}
