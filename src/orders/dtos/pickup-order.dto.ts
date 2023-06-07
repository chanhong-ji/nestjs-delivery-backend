import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@ArgsType()
export class PickUpOrderInput extends PickType(
    Order,
    ['id', 'driverId'],
    ArgsType,
) {}

@ObjectType()
export class PickUpOrderOutput extends CoreOutput {}
