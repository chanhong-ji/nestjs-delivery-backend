import { ArgsType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/users.entity';

@ArgsType()
export class DeleteAccountInput extends PartialType(
    PickType(User, ['password', 'email']),
    ArgsType,
) {}

@ObjectType()
export class DeleteAccountOutput extends CoreOutput {}
