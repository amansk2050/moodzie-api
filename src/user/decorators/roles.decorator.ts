import { SetMetadata } from '@nestjs/common';
import { UserRoles as Role } from '../enums/role.enum';
//use role entity intead of enum

export const ROLES_KEY = 'roles';

/**
 *
 * @param roles array of roles that are allowed access to APIs with role guard.
 * @returns custom decorator to be used for applying Role guard.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
