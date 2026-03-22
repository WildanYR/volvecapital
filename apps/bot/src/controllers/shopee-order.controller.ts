import { BrowserContext, Page, errors as PlaywrightErrors } from 'patchright';
import colors from 'yoctocolors';
import {
  SHP_ACCOUNT_INFO,
  SHP_LOGIN_ALERT,
  SHP_LOGIN_BUTTON,
  SHP_LOGIN_URL_PART,
  SHP_LOGINKEY_INPUT,
  SHP_ORDER_CARD,
  SHP_ORDER_CARDS_ID_ATTRIBUTE,
  SHP_ORDER_LIST_URL,
  SHP_ORDER_LIST_URL_PART,
  SHP_PASSWORD_INPUT,
  SHP_VERIFY_BY_WHATSAPP_BUTTON,
  SHP_VERIFY_OPEN_MODAL_BUTTON,
  SHP_VERIFY_URL_PART,
} from '../constants/shopee.const.js';
import { getLocator } from '../utils/page-locator.js';
import { randBetween, sleep } from '../utils/time.js';
import { Configuration } from '../types/config.type.js';
import { getProcessableOrders, updateOrderStatus } from '../core/store.js';
import { ShopeeShop } from '../types/shopee-shop.type.js';
import WorkerManager from '../core/worker-manager.js';
import { ProcessShopeeOrder } from './shopee-order-process.controller.js';
import { logger } from '../utils/logger.js';
import { generateBrowserContextName, saveStorageState } from '../utils/browser-state.js';

async function stopLoopCheckOrder(
  context: BrowserContext,
  workerManager: WorkerManager,
  shopName: string,
  message: string,
) {
  const contextName = generateBrowserContextName(shopName);
  await workerManager.stopAndWaitLoop(`${contextName}-state-saver`);
  await workerManager.stopAndWaitLoop(`${contextName}-runner`);
  await saveStorageState(context, shopName);
  await context.close();
  throw new Error(message);
}

export function loopCheckOrder(
  page: Page,
  shopData: ShopeeShop,
  config: Configuration,
  workerManager: WorkerManager,
) {
  return async () => {
    /**
     * ======================
     * Pastikan Login dan URL ada di Pesanan Belum Dikirim
     * ======================
     */
    await sleep(500);
    if (page.url().includes(SHP_LOGIN_URL_PART)) {
      logger.log(`${colors.yellowBright(shopData.name)} Mencoba Login ke Shopee`, {
        notifyContext: 'INFO',
        notifyMessage: `🔑 (${shopData.name}) Mencoba Login ke Shopee`,
      });
      const loginKeyInput = getLocator(page, SHP_LOGINKEY_INPUT);
      const passwordInput = getLocator(page, SHP_PASSWORD_INPUT);
      const loginButton = getLocator(page, SHP_LOGIN_BUTTON);

      try {
        await loginKeyInput.first().fill(shopData.loginKey);
        await passwordInput.first().fill(shopData.password);
        await loginButton.first().click();
      } catch (error) {
        await stopLoopCheckOrder(
          page.context(),
          workerManager,
          shopData.name,
          `Login Gagal: input loginKey, password, atau tombol login tidak ditemukan. Menghentikan Shopee ${shopData.name}`,
        );
      }

      const loginAlert = getLocator(page, SHP_LOGIN_ALERT);
      const accountInfo = getLocator(page, SHP_ACCOUNT_INFO);

      let afterLoginStatus = '';
      try {
        afterLoginStatus = await Promise.race([
          page.waitForURL((url) => url.pathname.includes(SHP_VERIFY_URL_PART)).then(() => 'verify'),
          accountInfo.waitFor({ state: 'visible' }).then(() => 'success'),
          loginAlert.waitFor({ state: 'visible' }).then(() => 'error'),
        ]);
      } catch (error) {
        await stopLoopCheckOrder(
          page.context(),
          workerManager,
          shopData.name,
          `Login Gagal: status login tidak berubah. Menghentikan Shopee ${shopData.name}`,
        );
      }

      if (afterLoginStatus === 'verify') {
        const verifyOpenModalButton = getLocator(page, SHP_VERIFY_OPEN_MODAL_BUTTON);
        const verifyByWhatsappButton = getLocator(page, SHP_VERIFY_BY_WHATSAPP_BUTTON);

        try {
          await verifyOpenModalButton.first().click();
          await verifyByWhatsappButton.first().click();
        } catch (error) {
          await stopLoopCheckOrder(
            page.context(),
            workerManager,
            shopData.name,
            `Verify Gagal: modal untuk verify tidak ditemukan. Menghentikan Shopee ${shopData.name}`,
          );
        }

        let elapsedTimeMs = 0;
        while (page.url().includes(SHP_VERIFY_URL_PART) && elapsedTimeMs < 600000) {
          elapsedTimeMs += config.min_wait_time_ms;
          await sleep(config.min_wait_time_ms);
        }

        if (elapsedTimeMs >= 600000) {
          logger.error(
            `${colors.yellowBright(shopData.name)} Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan`,
            undefined,
            {
              notifyContext: 'ERROR',
              notifyMessage: `❌🔑 (${shopData.name}) Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan`,
            },
          );

          await stopLoopCheckOrder(
            page.context(),
            workerManager,
            shopData.name,
            `Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan. Menghentikan Shopee ${shopData.name}`,
          );
        }
      } else if (afterLoginStatus === 'error') {
        let errorMessage = '';
        try {
          const alertMsg = await loginAlert.textContent();

          if (alertMsg) {
            errorMessage = alertMsg;
          }
        } catch (error) {
          if (error instanceof PlaywrightErrors.TimeoutError) {
            errorMessage = 'Pesan Error Login Shopee tidak ditemukan';
          } else {
            errorMessage = (error as Error).message;
          }

          logger.error(
            `${colors.yellowBright(shopData.name)} Login ke Shopee Gagal: ${errorMessage}`,
            (error as Error).stack,
            {
              notifyContext: 'ERROR',
              notifyMessage: `❌🔑 (${shopData.name}) Login ke Shopee Gagal: ${errorMessage}`,
            },
          );

          await stopLoopCheckOrder(
            page.context(),
            workerManager,
            shopData.name,
            `Login ke Shopee Gagal: ${errorMessage}. Menghentikan Shopee ${shopData.name}`,
          );
        }
      }

      logger.log(`${colors.yellowBright(shopData.name)} Login ke Shopee Berhasil`, {
        notifyContext: 'INFO',
        notifyMessage: `✅🔑 (${shopData.name}) Login ke Shopee Berhasil`,
      });
      if (!page.url().includes(SHP_ORDER_LIST_URL_PART)) {
        await page.goto(SHP_ORDER_LIST_URL);
      }
      await sleep(5000);
      await saveStorageState(page.context(), shopData.name);
    } else if (!page.url().includes(SHP_ORDER_LIST_URL_PART)) {
      await page.goto(SHP_ORDER_LIST_URL);
      await sleep(1000);
    }

    /**
     * ======================
     * Dapatkan Order Card jika ada
     * ======================
     */
    const orderCards = getLocator(page, SHP_ORDER_CARD);
    let orderIds: string[] = [];
    try {
      await orderCards.first().waitFor({ state: 'visible', timeout: config.min_wait_time_ms });
      const allOrderCards = await orderCards.all();
      const orderHrefWithNull = await Promise.all(
        allOrderCards.map((locator) => locator.getAttribute(SHP_ORDER_CARDS_ID_ATTRIBUTE)),
      );
      orderIds = orderHrefWithNull
        .map((href) => (href ? href.trim().split('/').pop() : null))
        .filter((id) => id !== null && id !== undefined);
    } catch (error) {
      if (!(error instanceof PlaywrightErrors.TimeoutError)) {
        logger.warn(
          `${colors.yellowBright(shopData.name)} order card error warning: ${(error as Error).message}`,
          {
            notifyContext: 'ERROR',
            notifyMessage: `❌ (${shopData.name}) order card error: ${(error as Error).message}`,
          },
        );
      }
    }

    if (orderIds.length) {
      for (const id of orderIds) {
        updateOrderStatus(id, 'queued', shopData.name);
      }
    }

    /**
     * ======================
     * Enqueue Order yang ditemukan dan yang belum diselesaikan
     * ======================
     */
    const processableOrder = getProcessableOrders(shopData.name);
    if (processableOrder.length) {
      for (const order of processableOrder) {
        workerManager.enqueue(
          ProcessShopeeOrder(page.context(), order.orderId, order.status, config, shopData),
          `${shopData.name}#${order.orderId}`,
        );
      }
    }

    /**
     * ======================
     * Reload Page
     * ======================
     */
    await sleep(randBetween(config.min_wait_time_ms, config.max_wait_time_ms));
    await page.reload();
    await sleep(1000);
  };
}
