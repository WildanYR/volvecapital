import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
export interface TenantAttributes {
    id: string;
    secret: string;
    created_at: Date;
    updated_at: Date;
}
interface TenantCreationAttributes extends Optional<TenantAttributes, 'created_at' | 'updated_at'> {
}
export declare class Tenant extends Model<TenantAttributes, TenantCreationAttributes> {
    id: string;
    secret: string;
}
export {};
