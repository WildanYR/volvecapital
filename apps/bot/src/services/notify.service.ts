import { API_BASE_URL } from '../configs/config.js';
import { FetchFailedError } from '../utils/errors.js';
import { authHeaders } from './auth-headers.js';

type ContextContent = 'INFO' | 'NEED_ACTION' | 'WARN' | 'ERROR';

export async function notify(context: ContextContent, message: string) {
  const headers: any = authHeaders();
  const url = `${API_BASE_URL}/notifier`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ context, message }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new FetchFailedError(data.message);
  }
}
