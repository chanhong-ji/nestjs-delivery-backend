import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, BeforeInsert, BeforeUpdate, AfterLoad } from 'typeorm';
import { IsEnum, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';

enum UserRole {
    Client,
    Owner,
    Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
@Entity()
export class User extends CoreEntity {
    private originalPassword?: string;

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

    @Field((type) => Boolean, { defaultValue: false })
    @Column({ default: false })
    verified: boolean;

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
