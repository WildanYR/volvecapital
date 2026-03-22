import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { AccountUser } from './account-user.model';
import { Transaction, TransactionAttributes } from './transaction.model';
export interface TransactionItemAttributes {
    id: string;
    name: string;
    transaction_id: string;
    account_user_id?: string;
    transaction: TransactionAttributes;
    user?: AccountUser;
    created_at: Date;
    updated_at: Date;
}
export interface TransactionItemCreationAttributes extends Optional<TransactionItemAttributes, 'id' | 'created_at' | 'updated_at' | 'transaction' | 'user'> {
}
export declare class TransactionItem extends Model<TransactionItemAttributes, TransactionItemCreationAttributes> {
    id: string;
    name: string;
    transaction_id: string;
    account_user_id?: string;
    transaction: Transaction;
    user?: AccountUser;
}
