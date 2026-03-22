import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Tenant, TenantAttributes } from './tenant.model';
export interface TeleNotifierAttributes {
    id: string;
    chat_id: number;
    chat_thread_id?: number;
    context: string;
    isEnabled: boolean;
    tenant_id: string;
    tenant: TenantAttributes;
    created_at: Date;
    updated_at: Date;
}
interface TeleNotifierCreationAttributes extends Optional<TeleNotifierAttributes, 'id' | 'created_at' | 'updated_at' | 'tenant'> {
}
export declare class TeleNotifier extends Model<TeleNotifierAttributes, TeleNotifierCreationAttributes> {
    id: string;
    chat_id: number;
    chat_thread_id?: number;
    context: string;
    isEnabled: boolean;
    tenant_id: string;
    tenant: Tenant;
}
export {};
