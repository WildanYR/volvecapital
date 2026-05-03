import { Page, Locator } from "playwright";

/**
 * Halaman Identitas / Email
 */
export const getUserLoginIdInput = (page: Page): Locator => 
    page.locator('[data-uia="field-userLoginId"]');

export const getContinueButton = (page: Page): Locator => 
    page.locator('[data-uia="continue-button"]');

/**
 * Halaman OTP / Get Help
 */
export const getPinEntry = (page: Page): Locator => 
    page.locator('[data-uia="pin-entry"]');

export const getRejoinText = (page: Page): Locator =>
    page.locator('a:has-text("kirim ulang"), a:has-text("resend"), [data-uia="resend-email-link"]');

export const getGetHelpText = (page: Page): Locator => 
    page.locator('p:has-text("Dapatkan Bantuan"), p:has-text("Get Help"), [data-uia="get-help-link"], button:has-text("Dapatkan Bantuan")').first();

export const getUsePasswordInsteadItem = (page: Page): Locator => 
    page.locator('a:has-text("Gunakan sandi"), a:has-text("Use password instead"), [data-uia="usePasswordInsteadHelpMenuItem"]').first();

/**
 * Halaman Password & Sign In
 */
export const getPasswordInput = (page: Page): Locator => 
    page.locator('[data-uia="password-input"]');

export const getSignInButton = (page: Page): Locator => 
    page.locator('[data-uia="sign-in-button"]');

/**
 * Error Messages
 */
export const getLoginErrorCallout = (page: Page): Locator => 
    page.locator('[data-uia="error-message-container"], .ui-message-error');
