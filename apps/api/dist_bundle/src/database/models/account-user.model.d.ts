import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { AccountProfile, AccountProfileAttributes } from './account-profile.model';
import { Account, AccountAttributes } from './account.model';
import { TransactionItem } from './transaction-item.model';
export interface AccountUserAttributes {
    id: string;
    name: string;
    status?: string;
    account_id: string;
    account_profile_id: string;
    account: AccountAttributes;
    profile: AccountProfileAttributes;
    transaction_item?: TransactionItem;
    created_at: Date;
    updated_at: Date;
    expired_at?: Date;
}
interface AccountUserCreationAttributes extends Optional<AccountUserAttributes, 'id' | 'created_at' | 'updated_at' | 'account' | 'profile' | 'transaction_item'> {
}
export declare class AccountUser extends Model<AccountUserAttributes, AccountUserCreationAttributes> {
    id: string;
    name: string;
    status?: string;
    account_id: string;
    account_profile_id: string;
    expired_at?: Date;
    account: Account;
    profile: AccountProfile;
    transaction_item?: TransactionItem;
}
export {};
