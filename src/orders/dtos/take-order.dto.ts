import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@ArgsType()
export class TakeOrderInput extends PickType(Order, ['id'], ArgsType) {}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {}
