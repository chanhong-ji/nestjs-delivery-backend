import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { User } from './../entities/users.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class LoginInput extends PickType(
    User,
    ['email', 'password'],
    ArgsType,
) {}

@ObjectType()
export class LoginOutPut extends CoreOutput {
    @Field((type) => String, { nullable: true })
    token?: string;
}
