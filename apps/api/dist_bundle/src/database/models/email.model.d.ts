import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';
export interface EmailAttributes {
    id: string;
    email: string;
    password?: string;
    accounts?: AccountAttributes[];
    created_at: Date;
    updated_at: Date;
}
interface EmailCreationAttributes extends Optional<EmailAttributes, 'id' | 'accounts' | 'created_at' | 'updated_at'> {
}
export declare class Email extends Model<EmailAttributes, EmailCreationAttributes> {
    id: string;
    email: string;
    password?: string;
    accounts?: Account[];
}
export {};
