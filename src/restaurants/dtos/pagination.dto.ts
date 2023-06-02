import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class PaginationInput {
    @Field((type) => Int, { defaultValue: 1 })
    page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
    @Field((type) => Int, { nullable: true })
    totalPages?: number;

    @Field((type) => Int, { nullable: true })
    totalItems?: number;
}