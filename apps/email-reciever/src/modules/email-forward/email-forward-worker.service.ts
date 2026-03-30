import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';
import { EmailForwardProcessorService } from './email-forward-processor.service';
import { EmailForwardQueueStore } from './email-forward-queue.store';

@Injectable()
export class EmailForwardWorkerService implements OnModuleInit, OnModuleDestroy {
  private running = false;
  private loopPromise?: Promise<void>;
  private recoveryTimer?: NodeJS.Timeout;
  private readonly pollIntervalMs = 200;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly emailForwardQueueStore: EmailForwardQueueStore,
    private readonly emailForwardProcessorService: EmailForwardProcessorService,
  ) {}

  onModuleInit() {
    if (!this.configService.get<boolean>('queue.workerEnabled')) {
      return;
    }

    this.recoverStaleJobs();
    this.running = true;
    this.loopPromise = this.runLoop();

    const staleTimeoutMs = this.configService.get<number>('queue.staleTimeoutMs')!;
    const intervalMs = Math.max(Math.min(Math.floor(staleTimeoutMs / 2), 60000), 1000);
    this.recoveryTimer = setInterval(() => {
      this.recoverStaleJobs();
    }, intervalMs);
  }

  async onModuleDestroy() {
    this.running = false;

    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = undefined;
    }

    await this.loopPromise;
  }

  recoverStaleJobs(now = new Date()) {
    const staleTimeoutMs = this.configService.get<number>('queue.staleTimeoutMs')!;
    return this.emailForwardQueueStore.recoverStaleJobs(staleTimeoutMs, now);
  }

  async processNextJob(now = new Date()) {
    const job = this.emailForwardQueueStore.claimNextJob(now);

    if (!job) {
      return false;
    }

    try {
      await this.emailForwardProcessorService.processQueuedPayload(job.payload);
      this.emailForwardQueueStore.deleteJob(job.id);
      this.logger.log(`Processed email-forward queue job ${job.id}`, 'EmailForwardWorker');
    }
    catch (error) {
      const retryDelayMs = this.configService.get<number>('queue.retryDelayMs')!;
      this.emailForwardQueueStore.markJobFailed(
        job.id,
        (error as Error).message,
        retryDelayMs,
        new Date(),
      );
      this.logger.error((error as Error).message, (error as Error).stack, 'EmailForwardWorker');
    }

    return true;
  }

  private async runLoop() {
    while (this.running) {
      const processed = await this.processNextJob();

      if (!processed) {
        await this.sleep(this.pollIntervalMs);
      }
    }
  }

  private async sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
