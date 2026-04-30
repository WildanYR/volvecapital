import type { Roles } from './roles.type';

export interface IAccessTokenPayload {
  id?: string;
  tenant_id: string;
  role: Roles;
  email?: string;
}
