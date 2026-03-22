/**
 * Locators for Request Reset Password Page
 */

import type { Page } from 'playwright';

export const getEmailRadio = (page: Page) => page.locator('[data-uia="login-help-radio-email"]');
export const getEmailInput = (page: Page) => page.locator('[data-uia="email"]');
export const getSendEmailButton = (page: Page) => page.locator('[data-uia="emailMeButton"]');
