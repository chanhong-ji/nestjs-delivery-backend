import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { User } from '../entities/users.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class PublicUser extends PickType(User, ['email', 'id', 'role']) {}

@ArgsType()
export class UserProfileInput {
    @Field((type) => Number)
    @IsNumber()
    userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
    @Field((type) => PublicUser, { nullable: true })
    user?: PublicUser;
}
