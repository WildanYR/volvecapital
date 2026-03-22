import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Tenant, TenantAttributes } from './tenant.model';
export interface TaskQueueAttributes {
    id: string;
    execute_at: Date;
    subject_id: string;
    context: string;
    payload: string;
    status?: string | null;
    error_message?: string;
    tenant_id: string;
    tenant: TenantAttributes;
    created_at: Date;
    updated_at: Date;
}
interface TaskQueueCreationAttributes extends Optional<TaskQueueAttributes, 'id' | 'created_at' | 'updated_at' | 'tenant'> {
}
export declare class TaskQueue extends Model<TaskQueueAttributes, TaskQueueCreationAttributes> {
    id: string;
    execute_at: Date;
    subject_id: string;
    context: string;
    payload: string;
    status?: string | null;
    error_message?: string | null;
    tenant_id: string;
    tenant: Tenant;
}
export {};
