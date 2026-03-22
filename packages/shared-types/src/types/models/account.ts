import { Optional } from "../optional-extend";
import { EmailAttributes } from "./email";

export interface AccountAttributes {
  id: string;
  account_password: string;
  subscription_expiry: Date;
  status?: string; // active (state aktif sedang dipakai user), ready (state aktif tidak dipakai user), disable
  billing?: string;
  label?: string;
  batch_start_date?: Date | null;
  batch_end_date?: Date | null;
  freeze_until?: Date | null;
  email_id: string;
  product_variant_id: string;
  email: EmailAttributes;
  product_variant: ProductVariantAttributes;
  user?: AccountUserAttributes[];
  profile?: AccountProfileAttributes[];
  modifier?: AccountModifierAttributes[];
  pinned?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'email'
    | 'product_variant'
    | 'user'
    | 'profile'
    | 'modifier'
  > {}