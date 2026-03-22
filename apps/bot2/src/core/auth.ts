/**
 * Auth - Authentication module for Volve Capital API
 * Handles fetching and caching access tokens
 */

import type { Database } from './Database.js';

/**
 * Auth credentials returned from API
 */
export interface AuthCredentials {
  tenantId: string;
  token: string;
}

// KV Store keys for auth credentials
const KV_AUTH_TENANT_ID = 'auth_tenant_id';
const KV_AUTH_TOKEN = 'auth_token';

/**
 * Custom error for auth failures
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Fetch access token from API
 */
export async function fetchAccessToken(
  apiBaseUrl: string,
  appId: string,
  appSecret: string
): Promise<AuthCredentials> {
  const url = `${apiBaseUrl}/tenant/access-token`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: appId, secret: appSecret }),
  });

  if (!res.ok) {
    let errorMessage = 'Gagal mendapatkan access token';
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) {
        errorMessage = `${errorMessage}: ${data.message}`;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new AuthenticationError(errorMessage);
  }

  const data = (await res.json()) as { id: string; token: string };
  return { tenantId: data.id, token: data.token };
}

/**
 * Get auth credentials from DB or fetch from API if not exists
 */
export async function getAuthCredentials(
  db: Database,
  apiBaseUrl: string,
  appId: string,
  appSecret: string
): Promise<AuthCredentials> {
  // Check if credentials exist in DB
  const tenantIdRow = db.get<{ value: string }>(
    'SELECT value FROM sys_kv_store WHERE key = ?',
    [KV_AUTH_TENANT_ID]
  );
  const tokenRow = db.get<{ value: string }>(
    'SELECT value FROM sys_kv_store WHERE key = ?',
    [KV_AUTH_TOKEN]
  );

  if (tenantIdRow && tokenRow) {
    return {
      tenantId: tenantIdRow.value,
      token: tokenRow.value,
    };
  }

  // Fetch from API
  const credentials = await fetchAccessToken(apiBaseUrl, appId, appSecret);

  // Save to DB
  db.run(
    `INSERT OR REPLACE INTO sys_kv_store (key, value, updated_at) 
     VALUES (?, ?, datetime('now'))`,
    [KV_AUTH_TENANT_ID, credentials.tenantId]
  );
  db.run(
    `INSERT OR REPLACE INTO sys_kv_store (key, value, updated_at) 
     VALUES (?, ?, datetime('now'))`,
    [KV_AUTH_TOKEN, credentials.token]
  );

  return credentials;
}

/**
 * Clear stored auth credentials (force re-authentication on next start)
 */
export function clearAuthCredentials(db: Database): void {
  db.run('DELETE FROM sys_kv_store WHERE key = ?', [KV_AUTH_TENANT_ID]);
  db.run('DELETE FROM sys_kv_store WHERE key = ?', [KV_AUTH_TOKEN]);
}

/**
 * Generate auth headers for API requests
 */
export function authHeaders(credentials: AuthCredentials): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `VC ${credentials.token}`,
    'x-tenant-id': credentials.tenantId,
  };
}
