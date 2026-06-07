/**
 * Locators for Request Reset Password Page
 */

import type { Page } from 'playwright';

export const getRstPwdEmailRadio = (page: Page) => page.locator('[data-uia="login-help-radio-email"]');
export const getRstPwdEmailInput = (page: Page) => page.locator('[data-uia="email"]');
export const getRstPwdSendEmailButton = (page: Page) => page.locator('[data-uia="emailMeButton"]');
export const getRstPwdAlert = (page: Page) => page.getByRole('alert')
export const getRstPwdEmailSentTitle = (page: Page) => page.locator('[data-uia="email-sent-title"]');
export const getRstPwdEmailValidationError = (page: Page) => page.locator('[data-uia="email+validationMessage"]')
