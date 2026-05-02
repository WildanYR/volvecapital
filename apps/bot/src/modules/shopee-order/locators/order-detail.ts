/**
 * Order Detail Page Locators
 */

import type { Page, Locator } from 'playwright';

export const getOrderStatus = (page: Page) =>
  page.locator('.order-status-wrapper .name');

export const getConfirmModal = (page: Page) =>
  page.locator('.eds-modal__box');

// Jasa Kirim Toko (JKT) buttons
export const getKirimButton = (page: Page) =>
  page.getByRole('button', { name: 'Kirim' });

// Jasa Kirim Standart (JKP) buttons
export const getAturPengirimanButton = (page: Page) =>
  page.getByRole('button', { name: 'Atur Pengiriman' });

export const getJKTAcceptButton = (locator: Locator) => 
  locator.getByRole('button', {name: 'Kirim'})

export const getJKPAcceptButton = (locator: Locator) =>
  locator.getByRole('button', { name: 'Konfirmasi' });

// Buyer info
export const getBuyerUsername = (page: Page) =>
  page.locator('.username');

// Product list
export const getProductList = (page: Page) =>
  page.locator('.product-list-item');

export const getProductName = (locator: Locator) =>
  locator.locator('.product-name');

export const getProductQty = (locator: Locator) =>
  locator.locator('.qty');

// Price
export const getTotalPriceCard = (page: Page) =>
  page.locator('div[type="FinalAmount"]');

export const getPriceAmount = (locator: Locator) =>
  locator.locator('.amount');

// Chat
export const getChatButton = (page: Page) =>
  page.getByRole('button', { name: 'Chat Sekarang' });

export const getChatInput = (page: Page) =>
  page.getByPlaceholder('Tulis pesan');
