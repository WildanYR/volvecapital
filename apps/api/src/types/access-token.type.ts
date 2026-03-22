import type { Roles } from './roles.type';

export interface IAccessTokenPayload {
  tenant_id: string;
  role: Roles;
}
