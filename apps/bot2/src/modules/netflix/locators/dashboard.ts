import { Page } from "playwright";

export function getNetflixLogoutHomeButton(page: Page) {
  return page.locator('a[data-uia="navigation+profile-menu+item"]')
}
export function getNetflixLogoutDashboardButton(page: Page) {
  return page.locator('a[data-uia="header-sign-out"]')
}
export const getNetflixMFAEmailButton = (page: Page) => page.locator('[data-uia="account-mfa-button-OTP_EMAIL+label"]');
export const getNetflixMFAOtpInput = (page: Page) => page.locator('[data-uia="collect-otp-input-modal-entry"], input[name="challengeOtp"]');
export const getNetflixMFAOtpSubmitButton = (page: Page) => page.locator('[data-uia="collect-input-submit-cta"]');
export const getMfaSuccessTitle = (page: Page) => page.locator('data-uia="manage-account-access-page+header+nested-page-nav+title"')
export const getMfaAlert = (page: Page) => page.getByRole('alert')
export const getProfileManageBtn = (page: Page) => page.locator('[data-uia="profile-choices-manage-button"]')