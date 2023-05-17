import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { User } from './../entities/users.entity';
import { MutationOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class CreateAccountInput extends PickType(
    User,
    ['email', 'password', 'role'],
    ArgsType,
) {}

@ObjectType()
export class CreateAccountOutput extends MutationOutput {}

@ArgsType()
export class LoginInput extends PickType(
    User,
    ['email', 'password'],
    ArgsType,
) {}

@ObjectType()
export class LoginOutPut extends MutationOutput {
    @Field((type) => String, { nullable: true })
    token?: string;
}
