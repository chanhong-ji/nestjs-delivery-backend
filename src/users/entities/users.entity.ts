import {
    Field,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import {
    Entity,
    Column,
    BeforeInsert,
    BeforeUpdate,
    AfterLoad,
    OneToMany,
} from 'typeorm';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from './../../restaurants/entities/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';

export enum UserRole {
    Client = 'Client',
    Owner = 'Owner',
    Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@Entity()
@ObjectType()
@InputType('user', { isAbstract: true })
export class User extends CoreEntity {
    private originalPassword?: string;

    @Field((type) => String)
    @Column()
    @IsEmail()
    email: string;

    @Field((type) => String)
    @Column()
    @IsString()
    password: string;

    @Field((type) => UserRole)
    @Column({ type: 'enum', enum: UserRole })
    @IsEnum(UserRole)
    role: UserRole;

    @Field((type) => Boolean, { defaultValue: false })
    @Column({ default: false })
    verified: boolean;

    @Field((type) => [Restaurant])
    @OneToMany((type) => Restaurant, (restaurant) => restaurant.owner)
    restaurants: Restaurant[];

    @Field((type) => [Order])
    @OneToMany((type) => Order, (order) => order.customer)
    orders: Order[];

    @Field((type) => [Order])
    @OneToMany((type) => Order, (order) => order.driver)
    rides: Order[];

    @AfterLoad()
    saveOriginPassword() {
        this.originalPassword = this.password;
    }

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        if (this.password !== this.originalPassword) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    async checkPassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}
