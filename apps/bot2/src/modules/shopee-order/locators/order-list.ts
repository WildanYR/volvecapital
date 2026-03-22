/**
 * Order List Page Locators
 */

import type { Page } from 'playwright';

export const getOrderCards = (page: Page) =>
  page.locator('a.order-card');

export const getAccountInfo = (page: Page) =>
  page.locator('.account-info');

export const getTerapkanButton = (page: Page) => 
  page.getByRole('button', {name: 'Terapkan'})