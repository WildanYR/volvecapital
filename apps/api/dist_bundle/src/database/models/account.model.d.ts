import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { AccountModifier, AccountModifierAttributes } from './account-modifier.model';
import { AccountProfile, AccountProfileAttributes } from './account-profile.model';
import { AccountUser, AccountUserAttributes } from './account-user.model';
import { Email, EmailAttributes } from './email.model';
import { ProductVariant, ProductVariantAttributes } from './product-variant.model';
export interface AccountAttributes {
    id: string;
    account_password: string;
    subscription_expiry: Date;
    status?: string;
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
export interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'created_at' | 'updated_at' | 'email' | 'product_variant' | 'user' | 'profile' | 'modifier'> {
}
export declare class Account extends Model<AccountAttributes, AccountCreationAttributes> {
    id: string;
    account_password: string;
    subscription_expiry: Date;
    status?: string;
    billing?: string;
    label?: string;
    batch_start_date?: Date;
    batch_end_date?: Date;
    freeze_until?: Date;
    email_id: string;
    product_variant_id: string;
    pinned: boolean;
    email: Email;
    product_variant: ProductVariant;
    user?: AccountUser[];
    profile?: AccountProfile[];
    modifier?: AccountModifier[];
}
