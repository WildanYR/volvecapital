/**
 * ShopeeOrderModule API Integration
 */

import { FetchFailedError, TransactionExistNoAccountError } from './errors.js';
import { ProductLookupItem, ProductPlatform, TransactionAccountPayload, AccountUser, FailedAccountUser, AccountProfile, Account } from './types/api.type.js';
import type { AuthCredentials } from '../../core/auth.js';
import { authHeaders } from '../../core/auth.js';

/**
 * Default fallback template jika VOUCHER_COPY_TEMPLATE belum dikonfigurasi di dashboard
 */
export const DEFAULT_VOUCHER_COPY_TEMPLATE = `Terima kasih telah melakukan pembelian di toko kami. Berikut adalah detail voucher Anda:

Produk       : $$product
Kode Voucher : $$voucher
Batas Klaim  : $$batasklaim
Link redeem  : $$linkredeem

KALO LINK GABISA DI KLIK COPY AJA TERUS PASTE KE WEB

Cara Redeem Voucher:
1. Klik link redeem di atas.
2. Kode voucher akan terisi otomatis.
3. Klik "Cek Sekarang", lalu klik "Aktivasi Voucher".
4. Jika berhasil, detail akun akan muncul seketika.`;

/**
 * Fetch VOUCHER_COPY_TEMPLATE dari settings API dashboard
 * Mengembalikan template string atau null jika tidak ditemukan
 */
export async function fetchVoucherCopyTemplate(
  apiBaseUrl: string,
  credentials: AuthCredentials,
): Promise<string | null> {
  try {
    const headers = authHeaders(credentials);
    const res = await fetch(`${apiBaseUrl}/setting`, { headers });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, string>;
    return data['VOUCHER_COPY_TEMPLATE'] ?? null;
  } catch {
    return null;
  }
}

/**
 * Check product names against platform products
 */
export async function checkProductNames(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  products: ProductLookupItem[],
  storeName?: string
): Promise<ProductPlatform[]> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/platform-product/resolve`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      platform: 'Shopee',
      items: products,
      store_name: storeName,
    }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { message: string };
    throw new FetchFailedError(`❌ fetch product names error: ${data.message}`);
  }

  const data = (await res.json()) as ProductPlatform[];
  return data;
}

/**
 * Generate account transaction - request accounts for buyer
 */
export async function generateAccountTransaction(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  orderId: string,
  payload: TransactionAccountPayload
): Promise<(AccountUser | FailedAccountUser)[]> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/transaction`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: `BOT${orderId}`, ...payload }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { message: string };
    if (data.message === 'TRANSACTION_EXIST_NO_ACCOUNT') {
      throw new TransactionExistNoAccountError(
        'Transaksi telah dibuat tapi tidak ada akun yang ditemukan'
      );
    }
    throw new FetchFailedError(data.message);
  }

  const responseData = (await res.json()) as { account_user: Record<string, unknown>[] };
  const { account_user } = responseData;

  const data: (AccountUser | FailedAccountUser)[] = account_user.map(
    (au) => {
      if (au.availability_status) {
        return au as unknown as FailedAccountUser;
      }

      const profile = au.profile as Record<string, unknown>;
      return {
        ...au,
        profile: {
          ...profile,
          metadata: profile.metadata
            ? convertStringToMetadataObject(profile.metadata as string | any[])
            : undefined,
        },
      } as AccountUser;
    }
  );

  return data;
}

/**
 * Generate voucher transaction - request a new voucher for buyer
 */
export interface VoucherPayload {
  product_variant_id: string;
  buyer_name: string;
  buyer_whatsapp?: string;
  buyer_email: string;
  platform: string;
  price: number;
  prefix?: string;
  store_name?: string;
}

export async function generateVoucherTransaction(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  payload: VoucherPayload
): Promise<any> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/voucher/generate`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json()) as { message: string };
    throw new FetchFailedError(`❌ generate voucher error: ${data.message}`);
  }

  return await res.json();
}

/**
 * Convert metadata string to object array
 */
function convertStringToMetadataObject(
  metadata: string | any[]
): { key: string; value: string }[] {
  if (Array.isArray(metadata)) {
    return metadata;
  }
  try {
    const parsedData = JSON.parse(metadata as string);

    if (Array.isArray(parsedData)) {
      return parsedData;
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Format date to Indonesian standard format
 */
function formatDateIdStandard(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Copy account template - format account data using template
 */
export async function copyAccountTemplate(
  profile: AccountProfile,
  account: Account,
  apiBaseUrl?: string,
  credentials?: AuthCredentials
): Promise<string> {
  const template = account.product_variant.copy_template;

  if (!template) {
    return '';
  }

  const regex = /\$\$([\w.]+)/g;
  const matches = [...template.matchAll(regex)];
  let result = template;

  const needsToken = matches.some(m => {
    const key = m[1].toLowerCase();
    return ['pclink', 'mobilelink', 'tvlink', 'generallink'].includes(key);
  });

  let netflixTokenData: any = null;
  if (needsToken && apiBaseUrl && credentials) {
    try {
      const url = `${apiBaseUrl}/account/${account.id}/netflix-token`;
      const res = await fetch(url, { headers: authHeaders(credentials) });
      if (res.ok) {
        netflixTokenData = await res.json();
      }
    } catch (err) {
      // Ignored: Leave placeholders empty or raw if token fetch fails
    }
  }

  for (const match of matches) {
    const placeholderKey = match[1];
    let replacement = match[0]; // fallback to raw string

    const keyParts = placeholderKey.split('.');
    const mainKey = keyParts[0];

    if (mainKey === 'metadata' && keyParts.length === 2) {
      const metaKey = keyParts[1];
      const metadataItem = profile.metadata?.find((item) => item.key === metaKey);
      replacement = metadataItem?.value ?? '';
    } else {
      switch (placeholderKey.toLowerCase()) {
        case 'email':
          replacement = account.email.email;
          break;
        case 'password':
          replacement = account.account_password;
          break;
        case 'expired':
          replacement = account.batch_end_date ? formatDateIdStandard(account.batch_end_date) : '';
          break;
        case 'product':
          replacement = `${account.product_variant.product?.name || ''} ${account.product_variant.name}`.trim();
          break;
        case 'profile':
          replacement = profile.name;
          break;
        case 'pclink':
          replacement = (netflixTokenData?.pcLink || '').replace(/^https?:\/\//, '');
          break;
        case 'mobilelink':
          replacement = (netflixTokenData?.mobileLink || '').replace(/^https?:\/\//, '');
          break;
        case 'tvlink':
          replacement = (netflixTokenData?.tvLink || '').replace(/^https?:\/\//, '');
          break;
        case 'generallink':
          replacement = (netflixTokenData?.generalLink || '').replace(/^https?:\/\//, '');
          break;
      }
    }

    result = result.replace(match[0], replacement);
  }

  return result;
}
