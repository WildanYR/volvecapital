/**
 * ShopeeOrderModule API Integration
 */

import { FetchFailedError, TransactionExistNoAccountError } from './errors.js';
import { ProductLookupItem, ProductPlatform, TransactionAccountPayload, AccountUser, FailedAccountUser, AccountProfile, Account } from './types/api.type.js';
import type { AuthCredentials } from '../../core/auth.js';
import { authHeaders } from '../../core/auth.js';

/**
 * Check product names against platform products
 */
export async function checkProductNames(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  products: ProductLookupItem[]
): Promise<ProductPlatform[]> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/platform-product/resolve`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      platform: 'Shopee',
      items: products,
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
            ? convertStringToMetadataObject(profile.metadata as string)
            : undefined,
        },
      } as AccountUser;
    }
  );

  return data;
}

/**
 * Convert metadata string to object array
 */
function convertStringToMetadataObject(
  metadata: string
): { key: string; value: string }[] {
  try {
    const parsedData = JSON.parse(metadata);

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
export function copyAccountTemplate(
  profile: AccountProfile,
  account: Account
): string {
  const template = account.product_variant.copy_template;

  if (!template) {
    return '';
  }

  const regex = /\$\$([\w.]+)/g;

  return template.replace(regex, (match: string, placeholderKey: string) => {
    const keyParts = placeholderKey.split('.');
    const mainKey = keyParts[0];

    if (mainKey === 'metadata' && keyParts.length === 2) {
      const metaKey = keyParts[1];
      const metadataItem = profile.metadata?.find((item) => item.key === metaKey);
      return metadataItem?.value ?? '';
    }

    switch (placeholderKey) {
      case 'email':
        return account.email.email;
      case 'password':
        return account.account_password;
      case 'expired':
        if (!account.batch_end_date) return '';
        return formatDateIdStandard(account.batch_end_date);
      case 'product':
        return `${account.product_variant.product?.name || ''} ${account.product_variant.name}`.trim();
      case 'profile':
        return profile.name;
      default:
        return match;
    }
  });
}
