# Module Rules

ini adalah dokumen yang menjelaskan rules bagaimana module dibuat.

## Base Module
setiap module harus extend class BaseModule di src/core/BaseModule.ts.

## Locator
locator harus disimpan dalam folder tersendiri yaitu folder locator didalam module.

tujuan dari pemisahan locator ini agar locator tidak dipakai langsung di kode tapi dipanggil melalui fungsi yang menerima args page dari playwright agar lebih mudah diubah ketika web tujuan mengubah komponennya.
contoh:

// modules/shopee/locators/login.ts
import type { Page } from 'playwright';

export const getUsernameInput = (page: Page) => page.locator('input[name="loginKey"]');
export const getPasswordInput = (page: Page) => page.locator('input[name="password"]');
export const getLoginButton = (page: Page) => page.locator('button[type="submit"]');
