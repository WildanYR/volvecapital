/**
 * Verify Page Locators
 */

import type { Page } from 'playwright';

export const getVerifyOpenModalButton = (page: Page) =>
  page.getByRole('button', { name: 'Verifikasi melalui link' });

export const getVerifyByWhatsappButton = (page: Page) =>
  page.getByRole('button', {
    name: /Click the button to send the authentication link through WhatsAPP/i,
  });
