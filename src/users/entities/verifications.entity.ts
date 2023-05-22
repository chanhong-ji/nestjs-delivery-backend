import { Field, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, Generated, JoinColumn, OneToOne } from 'typeorm';
import { User } from './users.entity';

@ObjectType()
@Entity()
export class Verification extends CoreEntity {
    @Field((type) => String)
    @Generated('uuid')
    @Column()
    code: string;

    @OneToOne((type) => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;
}
