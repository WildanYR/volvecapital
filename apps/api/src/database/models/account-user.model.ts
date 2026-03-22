import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import {
  AccountProfile,
  AccountProfileAttributes,
} from './account-profile.model';
import { Account, AccountAttributes } from './account.model';
import { TransactionItem } from './transaction-item.model';

export interface AccountUserAttributes {
  id: string;
  name: string;
  status?: string; // active, expired
  account_id: string;
  account_profile_id: string;
  account: AccountAttributes;
  profile: AccountProfileAttributes;
  transaction_item?: TransactionItem;
  created_at: Date;
  updated_at: Date;
  expired_at?: Date;
}

interface AccountUserCreationAttributes
  extends Optional<
    AccountUserAttributes,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'account'
    | 'profile'
    | 'transaction_item'
  > {}

@Table({ tableName: 'account_user' })
export class AccountUser extends Model<
  AccountUserAttributes,
  AccountUserCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare status?: string;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare account_id: string;

  @ForeignKey(() => AccountProfile)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare account_profile_id: string;

  @Column(DataType.DATE)
  declare expired_at?: Date;

  @BelongsTo(() => Account, 'account_id')
  declare account: Account;

  @BelongsTo(() => AccountProfile, 'account_profile_id')
  declare profile: AccountProfile;

  @HasOne(() => TransactionItem)
  declare transaction_item?: TransactionItem;
}
