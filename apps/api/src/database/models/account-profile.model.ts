import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AccountUser, AccountUserAttributes } from './account-user.model';
import { Account, AccountAttributes } from './account.model';

export interface AccountProfileAttributes {
  id: string;
  name: string;
  max_user: number;
  allow_generate: boolean;
  metadata?: string;
  account_id: string;
  account: AccountAttributes;
  user?: AccountUserAttributes[];
  created_at: Date;
  updated_at: Date;
}

interface AccountProfileCreationAttributes
  extends Optional<
    AccountProfileAttributes,
    'id' | 'created_at' | 'updated_at' | 'account' | 'user'
  > {}

@Table({ tableName: 'account_profile' })
export class AccountProfile extends Model<
  AccountProfileAttributes,
  AccountProfileCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  declare max_user: number;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare allow_generate: boolean;

  @Column(DataType.TEXT)
  declare metadata?: string;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare account_id: string;

  @BelongsTo(() => Account, 'account_id')
  declare account: Account;

  @HasMany(() => AccountUser)
  declare user?: AccountUser[];
}
