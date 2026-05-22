/**
 * Login Page Locators
 */

import type { Locator, Page } from 'playwright';

export const getLoginKeyInput = (page: Page) =>
  page.locator('input[name="loginKey"]');

export const getPasswordInput = (page: Page) =>
  page.locator('input[name="password"]');

export const getLoginButton = (page: Page) =>
  page.getByRole('button', { name: 'Log in' });

export const getLoginAlert = (page: Page) =>
  page.getByRole('alert');
