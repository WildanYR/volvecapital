import { AuthCredentials } from "../../core/auth.js";

function authHeaders(credentials: AuthCredentials): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `VC ${credentials.token}`,
    'x-tenant-id': credentials.tenantId,
  };
}

export async function updateNetflixAccountStatus(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  accountId: string,
  newPassword: string,
): Promise<void> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/account/${accountId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'ready', account_password: newPassword })
  })

  if (!res.ok) {
    const data = await res.json() as unknown as { message: string }
    throw new Error(data.message)
  }
}
