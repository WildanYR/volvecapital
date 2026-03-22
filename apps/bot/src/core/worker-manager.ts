import cron from 'node-cron';
import colors from 'yoctocolors';
import { logger } from '../utils/logger.js';

class LoopingWorker {
  id: string;
  func: () => Promise<void>;
  isRunning: boolean;
  loopPromise: Promise<void> | null = null;

  constructor(id: string, func: () => Promise<void>) {
    this.id = id;
    this.func = func;
    this.isRunning = false;
  }

  async _runLoop() {
    while (this.isRunning) {
      try {
        await this.func();
      } catch (error) {
        logger.error(
          `${colors.cyanBright('Worker Loop')} ${colors.bold(`[${this.id}]`)} Terjadi error: ${(error as Error).message}`,
          (error as Error).stack,
          {
            notifyContext: 'ERROR',
            notifyMessage: `(Worker Loop ${this.id})\nTerjadi error: ${(error as Error).message}`,
          },
        );
      }
      if (this.isRunning) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loopPromise = this._runLoop().finally(() => {
      this.loopPromise = null;
      this.isRunning = false;
    });
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
  }

  async stopAndWait() {
    if (!this.isRunning && !this.loopPromise) {
      return;
    }

    this.isRunning = false;
    if (this.loopPromise) {
      try {
        await this.loopPromise;
      } catch {}
    }
  }

  getStatus() {
    return this.isRunning || this.loopPromise !== null;
  }
}

class WorkerManager {
  loopingWorkers: Map<string, LoopingWorker>;

  private globalQueue: Array<() => Promise<void>>;
  private isQueueEnabled: boolean;
  private maxQueueConcurrency: number;
  private activeQueueWorkers: number;

  scheduledWorkers: Map<string, cron.ScheduledTask>;

  // ===== Dedup keys di sini =====
  private inFlight: Set<string>;

  constructor(maxQueueConcurrency: number = 1) {
    this.loopingWorkers = new Map();
    this.scheduledWorkers = new Map();

    this.globalQueue = [];
    this.isQueueEnabled = true;
    this.maxQueueConcurrency = Math.max(1, maxQueueConcurrency);
    this.activeQueueWorkers = 0;

    this.inFlight = new Set();
  }

  registerLoop(id: string, func: () => Promise<void> | void) {
    if (this.loopingWorkers.has(id)) {
      return false;
    }
    const asyncFunc = async () => {
      await func();
    };
    const worker = new LoopingWorker(id, asyncFunc);
    this.loopingWorkers.set(id, worker);
    return true;
  }

  startLoop(id: string) {
    const worker = this.loopingWorkers.get(id);
    if (worker) worker.start();
    else
      logger.error(`${colors.cyanBright('Worker Loop')} Looping worker "${id}" tidak ditemukan.`);
  }

  stopLoop(id: string) {
    const worker = this.loopingWorkers.get(id);
    if (worker) worker.stop();
    else
      logger.error(`${colors.cyanBright('Worker Loop')} Looping worker "${id}" tidak ditemukan.`);
  }

  async stopAndWaitLoop(id: string) {
    const worker = this.loopingWorkers.get(id);
    if (worker) await worker.stopAndWait();
    else
      logger.error(`${colors.cyanBright('Worker Loop')} Looping worker "${id}" tidak ditemukan.`);
  }

  unregisterLoop(id: string) {
    const worker = this.loopingWorkers.get(id);
    if (worker) {
      worker.stop();
      this.loopingWorkers.delete(id);
    }
  }

  private _launchQueueWorkers(): void {
    while (
      this.isQueueEnabled &&
      this.activeQueueWorkers < this.maxQueueConcurrency &&
      this.globalQueue.length > 0
    ) {
      this.activeQueueWorkers++;

      const task = this.globalQueue.shift()!;

      (async () => {
        try {
          await task();
        } catch (error) {
          logger.error(
            `${colors.cyanBright('Worker Queue')} Gagal menjalankan task: ${(error as Error).message}`,
            (error as Error).stack,
            {
              notifyContext: 'ERROR',
              notifyMessage: `(Worker Queue) Gagal menjalankan task: ${(error as Error).message}`,
            },
          );
        } finally {
          this.activeQueueWorkers--;
          this._launchQueueWorkers();
        }
      })();
    }
  }

  enqueue(task: () => Promise<void> | void, key?: string): boolean {
    if (typeof task !== 'function') {
      logger.error(`${colors.cyanBright('Worker Queue')} Tugas harus berupa fungsi.`);
      return false;
    }

    if (key) {
      if (this.inFlight.has(key)) {
        return false;
      }
      this.inFlight.add(key);
    }

    const wrapped = async () => {
      try {
        await task();
      } finally {
        if (key) this.inFlight.delete(key);
      }
    };

    this.globalQueue.push(wrapped);

    if (this.isQueueEnabled) {
      this._launchQueueWorkers();
    }

    return true;
  }

  registerCron(id: string, cronString: string, task: () => Promise<void> | void) {
    if (this.scheduledWorkers.has(id)) {
      logger.warn(`${colors.cyanBright('Worker Scheduler')} scheduler "${id}" sudah ada.`);
      return false;
    }
    if (!cron.validate(cronString)) {
      logger.error(
        `${colors.cyanBright('Worker Scheduler')} format cron "${cronString}" tidak valid.`,
      );
      return false;
    }

    const safeTask = async () => {
      try {
        await task();
      } catch (error) {
        logger.error(
          `${colors.cyanBright('Worker Scheduler')} ${colors.bold(`[${id}]`)} Terjadi error: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
    };

    const job = cron.schedule(cronString, safeTask);
    this.scheduledWorkers.set(id, job);
    return true;
  }

  stopCron(id: string) {
    const job = this.scheduledWorkers.get(id);
    if (job) {
      job.stop();
    } else {
      logger.error(`${colors.cyanBright('Worker Scheduler')} scheduler "${id}" tidak ditemukan.`);
    }
  }

  unregisterCron(id: string) {
    const job = this.scheduledWorkers.get(id);
    if (job) {
      job.stop();
      this.scheduledWorkers.delete(id);
    }
  }

  stopAll() {
    for (const worker of this.loopingWorkers.values()) {
      worker.stop();
    }

    this.isQueueEnabled = false;

    for (const job of this.scheduledWorkers.values()) {
      job.stop();
    }
  }

  async stopAndWaitAll() {
    const loopWorkers: LoopingWorker[] = [];
    for (const worker of this.loopingWorkers.values()) {
      loopWorkers.push(worker);
    }
    await Promise.allSettled(loopWorkers.map((w) => w.stopAndWait()));

    this.isQueueEnabled = false;

    for (const job of this.scheduledWorkers.values()) {
      job.stop();
    }
  }

  getQueueSize() {
    return this.globalQueue.length + this.activeQueueWorkers;
  }

  isKeyInFlight(key: string) {
    return this.inFlight.has(key);
  }
}

export default WorkerManager;
