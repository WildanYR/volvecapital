/**
 * Locators for Duoke Chat
 */

import { Page, Locator } from 'playwright';

// Login Page
export const getEmailInput = (page: Page) => page.locator('input[placeholder="Email"]');
export const getPasswordInput = (page: Page) => page.locator('input[placeholder="Password"]');
export const getCaptchaInput = (page: Page) => page.locator('input[placeholder="Verification Code"]');
export const getPolicyCheckbox = (page: Page) => page.locator('.policy_checkbox input[type="checkbox"]');
export const getLoginButton = (page: Page) => page.locator('button:has-text("Login")');

// Chat Page
export const getUnreadBadge = (page: Page) => page.locator('sup.el-badge__content:visible');
export const getBuyerName = (container: Locator) => container.locator('div.buyer_name');
export const getChatTextarea = (page: Page) => page.locator('textarea[placeholder*="quick reply"]');

// Helper to find valid chat items (has VISIBLE specific badge AND buyer name)
export const getChatItem = (page: Page) => 
    page.locator('div, li').filter({ 
        has: page.locator('sup.el-badge__content.is-fixed:visible') 
    }).filter({ 
        has: page.locator('div.buyer_name') 
    });

// Helper to find chat item container from badge
export const getChatItemContainer = (badge: Locator) => badge.locator('xpath=./ancestor::div[contains(@class, "chat_item")]');
