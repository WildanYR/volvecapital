import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
export interface EmailSubjectAttributes {
    id: string;
    context: string;
    subject: string;
    created_at: Date;
    updated_at: Date;
}
interface EmailSubjectCreationAttributes extends Optional<EmailSubjectAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export declare class EmailSubject extends Model<EmailSubjectAttributes, EmailSubjectCreationAttributes> {
    id: string;
    context: string;
    subject: string;
}
export {};
