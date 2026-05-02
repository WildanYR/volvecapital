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
