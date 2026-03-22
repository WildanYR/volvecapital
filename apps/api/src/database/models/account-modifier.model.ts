import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';

export interface AccountModifierAttributes {
  id: string;
  modifier_id: string;
  metadata: string;
  enabled: boolean;
  account_id: string;
  account: AccountAttributes;
  created_at: Date;
  updated_at: Date;
}

interface AccountModifierCreationAttributes
  extends Optional<
    AccountModifierAttributes,
    'id' | 'created_at' | 'updated_at' | 'account'
  > {}

@Table({ tableName: 'account_modifier' })
export class AccountModifier extends Model<
  AccountModifierAttributes,
  AccountModifierCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare modifier_id: string;

  @Column(DataType.TEXT)
  declare metadata: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare enabled: boolean;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare account_id: string;

  @BelongsTo(() => Account, 'account_id')
  declare account: Account;
}
