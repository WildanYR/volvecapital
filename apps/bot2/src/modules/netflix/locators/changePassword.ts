/**
 * Locators for Change Password Page
 */

import type { Page } from 'playwright';

export const getLoginHelpAnchor = (page: Page) => page.locator('[data-uia="change-password-page+button"]');
export const getCurrentPasswordInput = (page: Page) => page.locator('[data-uia="change-password-form+current-password-input"]');
export const getNewPasswordInput = (page: Page) => page.locator('[data-uia="change-password-form+new-password-input"]');
export const getConfirmNewPasswordInput = (page: Page) => page.locator('[data-uia="change-password-form+reeneter-new-password-input"]');
export const getLogAllDevicesCheckbox = (page: Page) => page.locator('[data-uia="change-password-form+soad-checkbox"]');
export const getSubmitButton = (page: Page) => page.locator('[data-uia="change-password-form+save-button"]');
export const getCurrentPasswordError = (page: Page) => page.locator('[data-uia*="current-password-input+validationMessage"]');
export const getGenericErrorAlert = (page: Page) => page.locator('[role="alert"]:has-text("Terjadi kesalahan")');
export const getMfaEmailButton = (page: Page) => page.locator('[data-uia="account-mfa-button-OTP_EMAIL+label"]');
export const getOtpInput = (page: Page) => page.locator('[data-uia="collect-otp-input-modal-entry"], input[name="challengeOtp"]');
export const getOtpSubmitButton = (page: Page) => page.locator('[data-uia="collect-input-submit-cta"]');
