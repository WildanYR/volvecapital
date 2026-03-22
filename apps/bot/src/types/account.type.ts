interface Email {
  id: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  name: string;
  duration: number;
  interval: number;
  cooldown: number;
  copy_template?: string;
  product_id: string;
  product: Product;
  created_at: Date;
  updated_at: Date;
}

export interface Metadata {
  key: string;
  value: string;
}

export interface Account {
  id: string;
  account_password: string;
  subscription_expiry: Date;
  status?: string; //active (state aktif sedang dipakai user), ready (state aktif tidak dipakai user), disable
  billing?: string;
  batch_start_date?: Date | null;
  batch_end_date?: Date | null;
  email_id: string;
  product_variant_id: string;
  email: Email;
  product_variant: ProductVariant;
}

export interface AccountProfile {
  id: string;
  name: string;
  max_user: number;
  allow_generate: boolean;
  metadata?: Metadata[];
  account_id: string;
}

export interface AccountUser {
  id: string;
  name: string;
  status?: string; //active, expired
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
