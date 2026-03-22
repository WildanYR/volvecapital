import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';

export interface EmailAttributes {
  id: string;
  email: string;
  password?: string;
  accounts?: AccountAttributes[];
  created_at: Date;
  updated_at: Date;
}

interface EmailCreationAttributes
  extends Optional<
    EmailAttributes,
    'id' | 'accounts' | 'created_at' | 'updated_at'
  > {}

@Table({ tableName: 'email' })
export class Email extends Model<EmailAttributes, EmailCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @Column(DataType.STRING)
  declare password?: string;

  @HasMany(() => Account)
  declare accounts?: Account[];
}
