import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from './../entities/users.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class CreateAccountInput extends PickType(
    User,
    ['email', 'password', 'role', 'address', 'dongCode'],
    ArgsType,
) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
