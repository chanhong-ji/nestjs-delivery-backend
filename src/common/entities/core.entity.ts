import { Field, ObjectType } from '@nestjs/graphql';
import {
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    Entity,
} from 'typeorm';

@ObjectType()
@Entity()
export class Common {
    @Field((type) => Number)
    @PrimaryGeneratedColumn()
    id: number;

    @Field((type) => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field((type) => Date)
    @CreateDateColumn()
    createdAt: Date;
}
