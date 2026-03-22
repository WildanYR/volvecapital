import { Optional } from "../optional-extend";
import { AccountAttributes } from "./account";
import { AccountUserAttributes } from "./account-user";

export interface AccountProfileAttributes {
  id: string;
  name: string;
  max_user: number;
  allow_generate: boolean;
  metadata?: string;
  account_id: string;
  account: AccountAttributes;
  user?: AccountUserAttributes[];
  created_at: Date;
  updated_at: Date;
}

export interface AccountProfileCreationAttributes
  extends Optional<
    AccountProfileAttributes,
    'id' | 'created_at' | 'updated_at' | 'account' | 'user'
  > {}