export interface ProductPlatform {
  name: string;
  product_variant_id: string;
  id?: string;
  isFound?: boolean;
}

export interface TransactionAccountPayload {
  customer: string;
  platform: string;
  total_price: number;
  items: { product_variant_id: string }[];
}

export interface AccountUser {
  id: string;
  name: string;
  status?: string;
  account_id: string;
  account_profile_id: string;
  account: Account;
  profile: AccountProfile;
}

export interface FailedAccountUser {
  availability_status: 'NOT_AVAILABLE' | 'COOLDOWN';
  product_variant_id: string;
  product_name: string;
}

export interface Account {
  id: string;
  account_password: string;
  subscription_expiry: Date;
  status?: string;
  billing?: string;
  batch_start_date?: Date | null;
  batch_end_date?: Date | null;
  email_id: string;
  product_variant_id: string;
  email: { id: string; email: string };
  product_variant: ProductVariant;
}

export interface ProductVariant {
  id: string;
  name: string;
  duration: number;
  interval: number;
  cooldown: number;
  copy_template?: string;
  product_id: string;
  product: { id: string; name: string };
  created_at: Date;
  updated_at: Date;
}

export interface AccountProfile {
  id: string;
  name: string;
  max_user: number;
  allow_generate: boolean;
  metadata?: { key: string; value: string }[];
  account_id: string;
}