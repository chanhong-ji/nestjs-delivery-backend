import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class CreateCategoryInput extends PickType(
    Category,
    ['name'],
    ArgsType,
) {}

@ObjectType()
export class CreateCategoryOutput extends CoreOutput {}
