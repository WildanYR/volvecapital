import { AuthCredentials, authHeaders } from "../../core/auth.js";


export async function updateNetflixAccountStatus(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  accountId: string,
  newPassword: string,
  status: string = 'ready',
  switch_to_harian: boolean = false,
): Promise<void> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/account/${accountId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ 
      status, 
      account_password: newPassword,
      switch_to_harian
    })
  })

  if (!res.ok) {
    const data = await res.json() as unknown as { message: string }
    throw new Error(data.message)
  }
}

export async function updateNetflixReloadStatus(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  accountId: string,
  subscriptionExpiry: Date,
): Promise<void> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/account/${accountId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: 'ready',
      subscription_expiry: subscriptionExpiry.toISOString(),
    }),
  });

  if (!res.ok) {
    const data = await res.json() as unknown as { message: string };
    throw new Error(data.message);
  }
}

export async function notifyTopupPending(
  apiBaseUrl: string,
  credentials: AuthCredentials,
  accountId: string,
  email: string,
  billing: string,
  taskId: string,
): Promise<void> {
  const headers = authHeaders(credentials);
  const url = `${apiBaseUrl}/account/${accountId}/request-topup`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, billing, taskId }),
  });

  // Non-fatal: jika endpoint gagal, log saja tapi jangan throw
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'unknown error' })) as unknown as { message: string };
    console.error(`[notifyTopupPending] Failed: ${data.message}`);
  }
}
