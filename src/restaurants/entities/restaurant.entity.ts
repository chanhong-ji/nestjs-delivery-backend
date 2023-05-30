import { Field, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './category.entity';
import { IsString } from 'class-validator';
import { User } from 'src/users/entities/users.entity';

@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    name: string;

    @Field((type) => String, { nullable: true })
    @Column({ nullable: true })
    @IsString()
    coverImage?: string;

    @Field((type) => String)
    @Column()
    @IsString()
    address: string;

    @Field((type) => Category, { nullable: true })
    @ManyToOne((type) => Category, (category) => category.restaurants, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    category: Category;

    @Field((type) => User)
    @ManyToOne((type) => User, (user) => user.restaurants, {
        onDelete: 'CASCADE',
    })
    user: User;
}
