import {
    ArgsType,
    Field,
    ObjectType,
    PartialType,
    PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/users.entity';

@ArgsType()
export class EditProfileInput extends PartialType(
    PickType(User, ['email', 'password']),
    ArgsType,
) {}

@ObjectType()
export class EditProfileOutput extends CoreOutput {
    @Field((returns) => User, { nullable: true })
    user?: User;
}
