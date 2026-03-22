import { LocatorId } from '../types/locator-id.type.js';

export const SHP_ORDER_LIST_URL = 'https://seller.shopee.co.id/portal/sale/order?type=toship';
export const SHP_ORDER_LIST_URL_PART = '?type=toship';
export const SHP_LOGIN_URL_PART = '/login';
export const SHP_VERIFY_URL_PART = '/verify';
export const SHP_ORDER_CARDS_ID_ATTRIBUTE = 'href';
export const SHP_STATUS_PROCESSED = /Sudah\s*Kirim/i;
export const SHP_STATUS_CANCELLED = /dibatalkan/i;

export const SHP_ORDER_DETAIL_URL = (id: string) =>
  `https://seller.shopee.co.id/portal/sale/order/${id}`;

export const SHP_LOGINKEY_INPUT: LocatorId = { type: 'locator', name: 'input[name="loginKey"]' };
export const SHP_PASSWORD_INPUT: LocatorId = { type: 'locator', name: 'input[name="password"]' };
export const SHP_LOGIN_BUTTON: LocatorId = { type: 'role', name: 'Log in', role: 'button' };
export const SHP_LOGIN_ALERT: LocatorId = { type: 'role', role: 'alert' };
export const SHP_ACCOUNT_INFO: LocatorId = { type: 'locator', name: '.account-info' };
export const SHP_VERIFY_OPEN_MODAL_BUTTON: LocatorId = {
  type: 'role',
  name: 'Verifikasi melalui link',
  role: 'button',
};
export const SHP_VERIFY_BY_WHATSAPP_BUTTON: LocatorId = {
  type: 'role',
  name: 'Click the button to send the authentication link through WhatsAPP',
  role: 'button',
};
export const SHP_ORDER_CARD: LocatorId = { type: 'locator', name: 'a.order-card' };
export const SHP_ORDER_USERNAME: LocatorId = { type: 'locator', name: '.username' };
export const SHP_ORDER_PRODUCT_LIST: LocatorId = { type: 'locator', name: '.product-list-item' };
export const SHP_ORDER_PRODUCT_NAME: LocatorId = { type: 'locator', name: '.product-name' };
export const SHP_ORDER_PRODUCT_QTY: LocatorId = { type: 'locator', name: '.qty' };
export const SHP_FINAL_PRICE_CARD: LocatorId = { type: 'locator', name: 'div[type="FinalAmount"]' };
export const SHP_FINAL_PRICE_TEXT: LocatorId = { type: 'locator', name: '.amount' };
export const SHP_CHAT_BUTTON: LocatorId = { type: 'role', name: 'Chat Sekarang', role: 'button' };
export const SHP_CHAT_INPUT: LocatorId = { type: 'placeholder', name: 'Tulis pesan' };
export const SHP_ORDER_STATUS_NAME: LocatorId = {
  type: 'locator',
  name: '.order-status-wrapper .name',
};
export const SHP_CONFIRM_MODAL_JKT_BUTTON: LocatorId = {
  type: 'role',
  name: 'Kirim',
  role: 'button',
};
export const SHP_CONFIRM_MODAL_JKP_BUTTON: LocatorId = {
  type: 'role',
  name: 'Atur Pengiriman',
  role: 'button',
};
export const SHP_CONFIRM_ACCEPT_JKT_BUTTON: LocatorId = {
  type: 'role',
  name: 'Kirim',
  role: 'button',
};
export const SHP_CONFIRM_ACCEPT_JKP_BUTTON: LocatorId = {
  type: 'role',
  name: 'Konfirmasi',
  role: 'button',
};
export const SHP_CONFIRM_MODAL_BOX: LocatorId = { type: 'locator', name: '.eds-modal__box' };
