import { Page } from "playwright";

export const getLoginEmailInput = (page: Page) => page.locator('[data-uia="field-userLoginId"]')
export const getLoginPasswordInput = (page: Page) => page.locator('[data-uia="password-input"]')
export const getLoginContinueBtn = (page: Page) => page.locator('[data-uia="continue-button"]')
export const getLoginSigninBtn = (page: Page) => page.locator('[data-uia="sign-in-button"]')
export const getLoginGetHelpToggle = (page: Page) => page.locator('[data-uia="help-menu-toggle-expanded"]')
export const getLoginUsePasswordInstead = (page: Page) => page.locator('[data-uia="usePasswordInsteadHelpMenuItem"]')
export const getLoginPinInput = (page: Page) => page.locator('[data-uia="pin-entry"]')
export const getLoginAlert = (page: Page) => page.getByRole('alert')