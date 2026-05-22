/**
 * ShopeeOrderModule Constants
 */

export const ORDER_LIST_URL = 'https://seller.shopee.co.id/portal/sale/order?type=toship';

export const ORDER_DETAIL_URL = (id: string) =>
  `https://seller.shopee.co.id/portal/sale/order/${id}`;

export const URL_PATTERNS = {
  NEW_ORDER_LIST: '?type=toship',
  LOGIN: '/login',
  VERIFY: '/verify',
} as const;

export const STATUS_PATTERNS = {
  ALREADY_PROCESSED: /Sudah\s*Kirim/i,
  CANCELLED: /dibatalkan/i,
} as const;

export const ORDER_CARD_ID_ATTRIBUTE = 'href';

export const VERIFY_TIMEOUT_MS = 600000; // 10 minutes
export const MIN_WAIT_TIME_MS = 5000;
export const DEFAULT_TIMEOUT_MS = 30000;
export const MAX_WAIT_TIME_MS = 15000;
export const MAX_RETRY_ATTEMPT = 3;