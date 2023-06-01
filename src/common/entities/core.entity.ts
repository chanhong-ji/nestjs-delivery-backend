import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    Entity,
} from 'typeorm';

@ObjectType()
@Entity()
export class CoreEntity {
    @Field((type) => Int)
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Field((type) => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field((type) => Date)
    @CreateDateColumn()
    createdAt: Date;
}
