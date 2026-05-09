/**
 * Netflix Reset Password Constants
 */

export const CHANGE_PASSWORD_URL = 'https://netflix.com/password';
export const REQUEST_RESET_URL = 'https://www.netflix.com/LoginHelp';
export const LOGIN_PATH = '/login';
export const MEMBERSHIP_URL = 'https://www.netflix.com/account/membership';
export const CANCEL_PLAN_URL = 'https://www.netflix.com/cancelplan';
export const CHANGE_PLAN_URL = 'https://www.netflix.com/changeplan';

// Netflix Plan IDs — dikonfirmasi langsung dari inspeksi DOM halaman netflix.com/changeplan
// Format elemen: <label data-uia="plan-selection+option+{ID}" for="select-{ID}">
export const PLAN_MOBILE_ID   = '4120'; // Mobile 480p
export const PLAN_STANDARD_ID = '3088'; // Standard 1080p
export const PLAN_PREMIUM_ID  = '3108'; // Premium 4K+HDR — Target Upgrade
