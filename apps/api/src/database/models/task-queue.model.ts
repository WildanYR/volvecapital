import { Optional } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Tenant, TenantAttributes } from './tenant.model';

export interface TaskQueueAttributes {
  id: string;
  execute_at: Date;
  subject_id: string;
  context: string;
  payload: string;
  status?: string | null; // 'QUEUED', 'DISPATCHED', 'COMPLETED', 'FAILED'
  error_message?: string;
  attempt?: number;
  tenant_id: string;
  tenant: TenantAttributes;
  created_at: Date;
  updated_at: Date;
}
interface TaskQueueCreationAttributes
  extends Optional<
    TaskQueueAttributes,
    'id' | 'created_at' | 'updated_at' | 'tenant'
  > {}

@Table({ tableName: 'task_queue' })
export class TaskQueue extends Model<
  TaskQueueAttributes,
  TaskQueueCreationAttributes
> {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare execute_at: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare subject_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare context: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare payload: string;

  @Column(DataType.STRING)
  declare status?: string | null;

  @Column(DataType.TEXT)
  declare error_message?: string | null;

  @Column(DataType.INTEGER)
  declare attempt?: number | null;

  @ForeignKey(() => Tenant)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare tenant_id: string;

  @BelongsTo(() => Tenant, 'tenant_id')
  declare tenant: Tenant;
}
