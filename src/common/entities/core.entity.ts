import { Field } from '@nestjs/graphql';
import { isNumber } from 'class-validator';
import {
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
} from 'typeorm';

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
