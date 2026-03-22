import fs from 'fs';
import { getConfig, initConfig } from './configs/config.js';
import { initBrowser, loadShopeeShop, recycleBrowser } from './core/browser.js';
import { clearOrderData, exitStore, getBotInfo, initStore, setBotInfo } from './core/store.js';
import WorkerManager from './core/worker-manager.js';
import { fetchAccessToken } from './services/login.service.js';
import { logger } from './utils/logger.js';
import { gracefullShutdown } from './utils/gracefull-shutdown.js';

async function main() {
  const config = initConfig();
  initStore();
  clearOrderData();

  let botInfo = getBotInfo();
  if (!botInfo.tenantId || !botInfo.tenantToken) {
    const authData = await fetchAccessToken(config.appId, config.appSecret);
    botInfo = setBotInfo({ tenantId: authData.id, tenantToken: authData.token });
  }

  logger.log(`🟢 Memulai Bot ${config.appId.toUpperCase()} 🟢`, {
    notifyContext: 'INFO',
    notifyMessage: `🟢 Memulai Bot **${config.appId.toUpperCase()}** 🟢`,
  });

  if (!fs.existsSync('browser-session')) {
    fs.mkdirSync('browser-session');
  }

  const workerManager = new WorkerManager(config.concurrency);

  workerManager.registerCron('clear-orders', '0 */2 * * *', clearOrderData);
  workerManager.registerCron(
    'recycle-browser',
    '*/15 * * * *',
    recycleBrowser(workerManager, config),
  );

  await initBrowser(workerManager, config);

  await loadShopeeShop(workerManager, config);

  process.on('SIGINT', () => {
    gracefullShutdown(workerManager, config, true);
  });

  process.on('SIGTERM', () => {
    gracefullShutdown(workerManager, config, true);
  });

  process.on('exit', () => {
    exitStore();
  });
}

main().catch((error) => {
  const config = getConfig();
  logger.error(
    `🛑 **(${config.appId.toUpperCase()})** Fatal: ${(error as Error).message}. Bot Berhenti`,
    (error as Error).stack,
    {
      notifyContext: 'ERROR',
      notifyMessage: `🛑 **(${config.appId.toUpperCase()})**\nFatal: ${(error as Error).message}. Bot Berhenti`,
    },
  );
});
