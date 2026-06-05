import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface DeviceSessionAttributes {
  id: string;
  user_id: string;
  tenant_id: string | null;
  user_type: string;
  device_info: string;
  ip_address: string;
  last_active_at: Date;
  is_revoked: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DeviceSessionCreationAttributes
  extends Optional<DeviceSessionAttributes, 'id' | 'is_revoked' | 'created_at' | 'updated_at' | 'last_active_at'> {}

@Table({ tableName: 'device_session' })
export class DeviceSession extends Model<DeviceSessionAttributes, DeviceSessionCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare user_id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare tenant_id: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare user_type: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare device_info: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare ip_address: string;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare last_active_at: Date;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_revoked: boolean;
}
