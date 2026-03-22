import { getBotInfo } from '../core/store.js';

export function authHeaders(): string[][] {
  const { tenantId, tenantToken } = getBotInfo();
  return [
    ['Content-Type', 'application/json'],
    ['Authorization', `VC ${tenantToken}`],
    ['x-tenant-id', tenantId!],
  ];
}
