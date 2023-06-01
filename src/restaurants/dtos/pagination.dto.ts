import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class PaginationInput {
    @Field((type) => Number, { defaultValue: 1 })
    page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
    @Field((type) => Number, { nullable: true })
    totalPages?: number;

    @Field((type) => Number, { nullable: true })
    totalItems?: number;
}
