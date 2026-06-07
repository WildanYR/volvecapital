/**
 * Locators for Change Password Page
 */

import type { Page } from 'playwright';

export const getLoginHelpAnchor = (page: Page) => page.locator('[data-uia="change-password-page+button"]');
export const getPwdCurrentPasswordInput = (page: Page) => page.locator('[data-uia="change-password-form+current-password-input"]');
export const getPwdNewPasswordInput = (page: Page) => page.locator('[data-uia="change-password-form+new-password-input"]');
export const getPwdConfirmNewPasswordInput = (page: Page) => page.locator('[data-uia="change-password-form+reeneter-new-password-input"]');
export const getPwdLogAllDevicesCheckbox = (page: Page) => page.locator('[data-uia="change-password-form+soad-checkbox"]');
export const getPwdSubmitButton = (page: Page) => page.locator('[data-uia="change-password-form+save-button"]');
export const getPwdAllInputValidation = (page: Page) => page.locator('[data-uia*="change-password-form"][data-uia*="validationMessage"]');
export const getPwdAlert = (page: Page) => page.getByRole('alert')