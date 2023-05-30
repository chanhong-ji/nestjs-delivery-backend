import { Field, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { IsString } from 'class-validator';

@Entity()
@ObjectType()
export class Category extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    name: string;

    @Field((type) => [Restaurant])
    @OneToMany((type) => Restaurant, (restaurant) => restaurant.category, {
        onDelete: 'NO ACTION',
    })
    restaurants: Restaurant[];
}
