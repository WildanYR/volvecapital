import fs from 'fs';
import { Browser, BrowserContext, chromium } from 'patchright';
import WorkerManager from './worker-manager.js';
import { Configuration } from '../types/config.type.js';
import { SHP_ORDER_LIST_URL } from '../constants/shopee.const.js';
import { loopCheckOrder } from '../controllers/shopee-order.controller.js';
import { sleep } from '../utils/time.js';
import {
  generateBrowserContextName,
  generateStorageStatePath,
  saveStorageState,
} from '../utils/browser-state.js';
import { logger } from '../utils/logger.js';
import { gracefullShutdown } from '../utils/gracefull-shutdown.js';

let browser: Browser;
let isRecycle = false;

export async function initBrowser(workerManager: WorkerManager, config: Configuration) {
  browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-networking',
    ],
  });
  browser.on('disconnected', () => {
    if (!isRecycle) {
      gracefullShutdown(workerManager, config, false);
    }
  });
}

export async function exitBrowser() {
  isRecycle = true;
  await browser?.close();
}

export async function loadShopeeShop(workerManager: WorkerManager, config: Configuration) {
  if (!config.shopee_shop?.length) {
    throw new Error(
      'Shopee Shop belum ada dalam konfigurasi. silahkan tambahkan di file konfigurasi',
    );
  }

  if (!browser) {
    throw new Error('browser belum di inisiasi');
  }

  for (const shop of config.shopee_shop) {
    const contextStatePath = generateStorageStatePath(shop.name);
    const hasContextState = fs.existsSync(contextStatePath);

    const context = await browser.newContext({
      serviceWorkers: 'block',
      viewport: { width: 1366, height: 768 },
      storageState: hasContextState ? contextStatePath : undefined,
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    });
    const contextName = generateBrowserContextName(shop.name);
    const runnerId = `${contextName}-runner`;
    const stateSaverId = `${contextName}-state-saver`;

    context.on('close', () => {
      workerManager.unregisterLoop(runnerId);
      workerManager.unregisterLoop(stateSaverId);
    });

    const orderPage = await context.newPage();
    orderPage.setDefaultTimeout(config.timeout);
    orderPage.setDefaultNavigationTimeout(config.timeout);
    await orderPage.goto(SHP_ORDER_LIST_URL);

    workerManager.registerLoop(runnerId, loopCheckOrder(orderPage, shop, config, workerManager));
    workerManager.registerLoop(stateSaverId, _loopSaveStorageState(context, shop.name));

    workerManager.startLoop(runnerId);
    workerManager.startLoop(stateSaverId);
  }
}

export function recycleBrowser(workerManager: WorkerManager, config: Configuration) {
  return async () => {
    const loopWaitingList: string[] = [];
    // Initial Stop Loop
    for (const shop of config.shopee_shop) {
      const contextName = generateBrowserContextName(shop.name);
      const stateSaverId = `${contextName}-state-saver`;
      const runnerId = `${contextName}-runner`;
      workerManager.stopLoop(stateSaverId);
      workerManager.stopLoop(runnerId);
      loopWaitingList.push(stateSaverId);
      loopWaitingList.push(runnerId);
    }

    // Menunggu semua proses diselesaikan
    while (workerManager.getQueueSize() > 0) {
      await sleep(60000);
    }

    // Menunggu loop yang belum selesai
    await Promise.allSettled(loopWaitingList.map((id) => workerManager.stopAndWaitLoop(id)));

    logger.log(`🟣 Recycle Browser 🟣`);
    for (const shop of config.shopee_shop) {
      const contextName = generateBrowserContextName(shop.name);
      workerManager.unregisterLoop(`${contextName}-runner`);
      workerManager.unregisterLoop(`${contextName}-state-saver`);
    }

    isRecycle = true;
    await browser.close();
    await initBrowser(workerManager, config);
    await loadShopeeShop(workerManager, config);
    isRecycle = false;
  };
}

function _loopSaveStorageState(context: BrowserContext, shopName: string) {
  return async () => {
    try {
      await saveStorageState(context, shopName);
      await sleep(60000);
    } catch {}
  };
}
