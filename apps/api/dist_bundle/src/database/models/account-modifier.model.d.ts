import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';
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
interface AccountModifierCreationAttributes extends Optional<AccountModifierAttributes, 'id' | 'created_at' | 'updated_at' | 'account'> {
}
export declare class AccountModifier extends Model<AccountModifierAttributes, AccountModifierCreationAttributes> {
    id: string;
    modifier_id: string;
    metadata: string;
    enabled: boolean;
    account_id: string;
    account: Account;
}
export {};
