import { API_BASE_URL } from '../configs/config.js';
import { ProductPlatform } from '../types/product-platform.type.js';
import { FetchFailedError } from '../utils/errors.js';
import { authHeaders } from './auth-headers.js';

export async function checkProductNames(productNames: string[]) {
  const headers: any = authHeaders();
  const url = new URL(`${API_BASE_URL}/platform-product/by-names`);
  url.searchParams.append('platform', 'Shopee');
  url.searchParams.append('names', productNames.join(','));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new FetchFailedError(`❌ fetch product names error: ${data.message}`);
  }

  const data: ProductPlatform[] = await res.json();

  return data;
}
