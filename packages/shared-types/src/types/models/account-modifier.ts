import { Optional } from "../optional-extend";
import { AccountAttributes } from "./account";

export interface AccountModifierAttributes {
  id: string;
  modifier_id: string;
  metadata: string;
  enabled: boolean;
  account_id: string;
  account: AccountAttributes;
  created_at: Date;
  updated_at: Date;
}

export interface AccountModifierCreationAttributes
  extends Optional<
    AccountModifierAttributes,
    'id' | 'created_at' | 'updated_at' | 'account'
  > {}