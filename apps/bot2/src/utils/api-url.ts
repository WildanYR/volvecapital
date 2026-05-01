const API_BASE_HOST_FORMAT_MESSAGE =
  '[app.api_base_url] must be a hostname or host:port without protocol, path, query, hash, or slashes. Examples: "api.volve-capital.com", "localhost:3000".';

export function normalizeApiBaseHost(apiBaseHost: string): string {
  const host = apiBaseHost.trim();

  if (!host) {
    throw new Error('[app.api_base_url] is required');
  }

  // If it already has a protocol, just return it after a basic check
  if (host.includes('://')) {
    return host;
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
  const normalized = normalizeApiBaseHost(apiBaseHost);
  if (normalized.includes('://')) return new URL(normalized).origin;
  
  const protocol = normalized.startsWith('localhost') || normalized.startsWith('127.0.0.1') ? 'http' : 'https';
  return new URL(`${protocol}://${normalized}`).origin;
}

export function buildSocketBaseUrl(apiBaseHost: string): string {
  const normalized = normalizeApiBaseHost(apiBaseHost);
  if (normalized.includes('://')) {
    const url = new URL(normalized);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}`;
  }
  
  const protocol = normalized.startsWith('localhost') || normalized.startsWith('127.0.0.1') ? 'ws' : 'wss';
  return `${protocol}://${normalized}`;
}
