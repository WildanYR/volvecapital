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
export const getClosePopupButton = (page: Page) => page.locator('i.el-dialog__close.el-icon.el-icon-close');
export const getUnansweredTab = (page: Page) => page.locator('i.icon_unanswered');
export const getUnreadBadge = (page: Page) => page.locator('sup.el-badge__content:visible');
export const getBuyerName = (container: Locator) => container.locator('div.buyer_name');
export const getChatTextarea = (page: Page) => page.locator('textarea').last();
export const getSendButton = (page: Page) => page.locator('i.icon_send_chatbox');
export const getOrderTab = (page: Page) => page.locator('#tab-order');
export const getReadyToShipTag = (page: Page) => page.locator('#pane-order .el-tag:has-text("Ready to Ship")');
export const getUnpaidTag = (page: Page) => page.locator('#pane-order .el-tag:has-text("Unpaid")');

// Helper to find valid chat items (has VISIBLE specific badge AND buyer name)
export const getChatItem = (page: Page) => 
    page.locator('div, li').filter({ 
        has: page.locator('sup.el-badge__content.is-fixed:visible') 
    }).filter({ 
        has: page.locator('div.buyer_name') 
    });

// Helper to find chat item container from badge
export const getChatItemContainer = (badge: Locator) => badge.locator('xpath=./ancestor::div[contains(@class, "chat_item")]');
