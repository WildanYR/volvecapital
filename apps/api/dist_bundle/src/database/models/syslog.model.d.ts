import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Tenant } from './tenant.model';
export interface SyslogAttributes {
    id: string;
    level: string;
    context: string;
    message: string;
    stack?: string | null;
    tenant_id?: string | null;
    created_at: Date;
}
interface SyslogCreationAttributes extends Optional<SyslogAttributes, 'id'> {
}
export declare class Syslog extends Model<SyslogAttributes, SyslogCreationAttributes> {
    id: string;
    level: string;
    context: string;
    message: string;
    stack?: string;
    tenant_id?: string;
    created_at: Date;
    tenant?: Tenant;
}
export {};
