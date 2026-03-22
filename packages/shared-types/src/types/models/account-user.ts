import { Optional } from "../optional-extend";
import { AccountAttributes } from "./account";
import { AccountProfileAttributes } from "./account-profile";

export interface AccountUserAttributes {
  id: string;
  name: string;
  status?: string; // active, expired
  account_id: string;
  account_profile_id: string;
  account: AccountAttributes;
  profile: AccountProfileAttributes;
  transaction_item?: TransactionItem;
  created_at: Date;
  updated_at: Date;
  expired_at?: Date;
}

export interface AccountUserCreationAttributes
  extends Optional<
    AccountUserAttributes,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'account'
    | 'profile'
    | 'transaction_item'
  > {}