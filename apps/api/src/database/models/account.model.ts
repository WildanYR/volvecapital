import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import {
  AccountCapital,
  AccountCapitalAttributes,
} from './account-capital.model';
import {
  AccountModifier,
  AccountModifierAttributes,
} from './account-modifier.model';
import {
  AccountProfile,
  AccountProfileAttributes,
} from './account-profile.model';
import { AccountUser, AccountUserAttributes } from './account-user.model';
import { Email, EmailAttributes } from './email.model';
import {
  ProductVariant,
  ProductVariantAttributes,
} from './product-variant.model';

export interface AccountAttributes {
  id: string;
  account_password: string;
  subscription_expiry: Date;
  status?: string; // active (state aktif sedang dipakai user), ready (state aktif tidak dipakai user), disable
  billing?: string;
  label?: string;
  batch_start_date?: Date | null;
  batch_end_date?: Date | null;
  freeze_until?: Date | null;
  email_id: string;
  product_variant_id: string;
  email: EmailAttributes;
  product_variant: ProductVariantAttributes;
  user?: AccountUserAttributes[];
  profile?: AccountProfileAttributes[];
  modifier?: AccountModifierAttributes[];
  capitals?: AccountCapitalAttributes[];
  pinned?: boolean;
  capital_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'email'
    | 'product_variant'
    | 'user'
    | 'profile'
    | 'modifier'
    | 'capital_price'
  > {}

@Table({ tableName: 'account' })
export class Account extends Model<
  AccountAttributes,
  AccountCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare account_password: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare subscription_expiry: Date;

  @Column(DataType.STRING)
  declare status?: string;

  @Column(DataType.STRING)
  declare billing?: string;

  @Column(DataType.STRING)
  declare label?: string;

  @Column(DataType.DATE)
  declare batch_start_date?: Date;

  @Column(DataType.DATE)
  declare batch_end_date?: Date;

  @Column(DataType.DATE)
  declare freeze_until?: Date;

  @ForeignKey(() => Email)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare email_id: string;

  @ForeignKey(() => ProductVariant)
  @Column(DataType.BIGINT)
  declare product_variant_id: string;

  @Column(DataType.BOOLEAN)
  declare pinned: boolean;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare capital_price: number;

  @BelongsTo(() => Email, 'email_id')
  declare email: Email;

  @BelongsTo(() => ProductVariant, 'product_variant_id')
  declare product_variant: ProductVariant;

  @HasMany(() => AccountUser)
  declare user?: AccountUser[];

  @HasMany(() => AccountProfile)
  declare profile?: AccountProfile[];

  @HasMany(() => AccountModifier)
  declare modifier?: AccountModifier[];

  @HasMany(() => AccountCapital)
  declare capitals?: AccountCapital[];
}
