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
