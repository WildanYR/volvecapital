import { API_BASE_URL } from '../configs/config.js';
import { FetchFailedError } from '../utils/errors.js';

export async function fetchAccessToken(tenantId: string, secret: string) {
  const url = `${API_BASE_URL}/tenant/access-token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, secret }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new FetchFailedError(`Gagal mendapatkan access token: ${data.message}`);
  }
  const data = await res.json();

  return { id: data.id, token: data.token };
}
