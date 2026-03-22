import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { TransactionItem, TransactionItemAttributes } from './transaction-item.model';
export interface TransactionAttributes {
    id: string;
    customer: string;
    platform: string;
    total_price: number;
    items: TransactionItemAttributes[];
    created_at: Date;
    updated_at: Date;
}
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'created_at' | 'updated_at' | 'items'> {
}
export declare class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> {
    id: string;
    customer: string;
    platform: string;
    total_price: number;
    items: TransactionItem[];
}
export {};
