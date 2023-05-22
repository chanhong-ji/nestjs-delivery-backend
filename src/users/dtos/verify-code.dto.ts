import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Verification } from '../entities/verifications.entity';

@ArgsType()
export class VerifyCodeInput extends PickType(
    Verification,
    ['code'],
    ArgsType,
) {}

@ObjectType()
export class VerifyCodeOutput extends CoreOutput {}
