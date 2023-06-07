import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@ArgsType()
export class CancelOrderInput extends PickType(Order, ['id'], ArgsType) {}

@ObjectType()
export class CancelOrderOutput extends CoreOutput {}
