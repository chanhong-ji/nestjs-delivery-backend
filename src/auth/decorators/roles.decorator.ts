import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/users.entity';

export type RolesType = keyof typeof UserRole | 'Admin';

export const Role = (roles: RolesType[]) => SetMetadata('roles', roles);
