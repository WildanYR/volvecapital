import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { AccountUser, AccountUserAttributes } from './account-user.model';
import { Account, AccountAttributes } from './account.model';
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
interface AccountProfileCreationAttributes extends Optional<AccountProfileAttributes, 'id' | 'created_at' | 'updated_at' | 'account' | 'user'> {
}
export declare class AccountProfile extends Model<AccountProfileAttributes, AccountProfileCreationAttributes> {
    id: string;
    name: string;
    max_user: number;
    allow_generate: boolean;
    metadata?: string;
    account_id: string;
    account: Account;
    user?: AccountUser[];
}
export {};
