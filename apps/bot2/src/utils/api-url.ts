const API_BASE_HOST_FORMAT_MESSAGE =
  '[app.api_base_url] must be a hostname or host:port without protocol, path, query, hash, or slashes. Examples: "api.volve-capital.com", "localhost:3000".';

export function normalizeApiBaseHost(apiBaseHost: string): string {
  const host = apiBaseHost.trim();

  if (!host) {
    throw new Error('[app.api_base_url] is required');
  }

  if (host.includes('://')) {
    throw new Error(
      `[app.api_base_url] must not include a protocol. Use a hostname like "api.volve-capital.com", not "${apiBaseHost}".`
    );
  }

  if (host.includes('/') || host.includes('?') || host.includes('#')) {
    throw new Error(API_BASE_HOST_FORMAT_MESSAGE);
  }

  if (host.includes('@')) {
    throw new Error(API_BASE_HOST_FORMAT_MESSAGE);
  }

  let parsed: URL;
  try {
    parsed = new URL(`https://${host}`);
  } catch {
    throw new Error(API_BASE_HOST_FORMAT_MESSAGE);
  }

  if (!parsed.hostname || parsed.username || parsed.password) {
    throw new Error(API_BASE_HOST_FORMAT_MESSAGE);
  }

  return parsed.host;
}

export function buildApiBaseUrl(apiBaseHost: string): string {
  return new URL(`https://${normalizeApiBaseHost(apiBaseHost)}`).origin;
}

export function buildSocketBaseUrl(apiBaseHost: string): string {
  return new URL(`wss://${normalizeApiBaseHost(apiBaseHost)}`).origin;
}
