import type { Request } from 'express';
import type { IAccessTokenPayload } from './access-token.type';

export interface AppRequest extends Request {
  user?: IAccessTokenPayload;
  tenant_id?: string;
}
