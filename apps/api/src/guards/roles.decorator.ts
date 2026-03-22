import type { Roles } from 'src/types/roles.type';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'ROLES_KEY';
export function RolesCheck(...roles: Array<Roles>) {
  return SetMetadata(ROLES_KEY, roles);
}
