import { exitBrowser } from '../core/browser.js';
import { exitStore } from '../core/store.js';
import WorkerManager from '../core/worker-manager.js';
import { notify } from '../services/notify.service.js';
import { Configuration } from '../types/config.type.js';
import { logger } from './logger.js';
import { sleep } from './time.js';

export async function gracefullShutdown(
  workerManager: WorkerManager,
  config: Configuration,
  closeBrowser: boolean,
) {
  try {
    try {
      await workerManager.stopAndWaitAll();
    } catch {}
    if (closeBrowser) {
      try {
        await exitBrowser();
      } catch {}
    }
    try {
      exitStore();
    } catch {}
    try {
      logger.log(`🛑 Bot ${config.appId.toUpperCase()} Ditutup 🛑`);
      await notify('INFO', `🛑 Bot **${config.appId.toUpperCase()}** Ditutup 🛑`);
    } catch {}
    await sleep(50);
  } finally {
    process.exit(0);
  }
}
