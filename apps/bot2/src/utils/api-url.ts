/**
 * API URL Utilities
 * Validates and normalizes API URLs for HTTP and WebSocket protocols.
 */

export function validateHttpUrl(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    throw new Error('[app.api_http_url] is required');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('[app.api_http_url] must be a valid URL. Example: "https://api.volve-capital.com"');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`[app.api_http_url] protocol must be http:// or https://, but got "${url.protocol}//"`);
  }

  return url.origin;
}

export function validateWebsocketUrl(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    throw new Error('[app.api_websocket_url] is required');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('[app.api_websocket_url] must be a valid URL. Example: "wss://api.volve-capital.com"');
  }

  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error(`[app.api_websocket_url] protocol must be ws:// or wss://, but got "${url.protocol}//"`);
  }

  return url.origin;
}
