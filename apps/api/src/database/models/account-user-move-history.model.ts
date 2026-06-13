import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AccountProfile } from './account-profile.model';
import { AccountUser } from './account-user.model';
import { Account } from './account.model';

export interface AccountUserMoveHistoryAttributes {
  id: string;
  account_user_id: string;
  from_account_id: string;
  from_profile_id: string;
  to_account_id: string;
  to_profile_id: string;
  reason: string;
  created_at?: Date;
  updated_at?: Date;
}

interface AccountUserMoveHistoryCreationAttributes
  extends Optional<AccountUserMoveHistoryAttributes, 'id'> {}

@Table({ tableName: 'account_user_move_history' })
export class AccountUserMoveHistory extends Model<
  AccountUserMoveHistoryAttributes,
  AccountUserMoveHistoryCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @ForeignKey(() => AccountUser)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare account_user_id: string;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare from_account_id: string;

  @ForeignKey(() => AccountProfile)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare from_profile_id: string;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare to_account_id: string;

  @ForeignKey(() => AccountProfile)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare to_profile_id: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare reason: string;

  @BelongsTo(() => AccountUser, 'account_user_id')
  declare account_user: AccountUser;

  @BelongsTo(() => Account, 'from_account_id')
  declare from_account: Account;

  @BelongsTo(() => AccountProfile, 'from_profile_id')
  declare from_profile: AccountProfile;

  @BelongsTo(() => Account, 'to_account_id')
  declare to_account: Account;

  @BelongsTo(() => AccountProfile, 'to_profile_id')
  declare to_profile: AccountProfile;
}
