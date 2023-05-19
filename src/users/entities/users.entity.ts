import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Common } from 'src/common/entities/core.entity';

enum UserRole {
    Client,
    Owner,
    Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
@Entity()
export class User extends Common {
    @Field((type) => String)
    @Column()
    @IsString()
    email: string;

    @Field((type) => String)
    @Column()
    @IsString()
    password: string;

    @Field((type) => UserRole)
    @Column({ type: 'enum', enum: UserRole })
    @IsEnum(UserRole)
    role: UserRole;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async checkPassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}
