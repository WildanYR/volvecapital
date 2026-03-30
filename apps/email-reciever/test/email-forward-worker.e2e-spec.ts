import type { TestingModule } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EmailForwardProcessorService } from '../src/modules/email-forward/email-forward-processor.service';
import { EmailForwardQueueStore } from '../src/modules/email-forward/email-forward-queue.store';
import { EmailForwardWorkerService } from '../src/modules/email-forward/email-forward-worker.service';
import { AppLoggerService } from '../src/modules/logger/logger.service';

describe('Email forward worker', () => {
  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  const mockProcessor = {
    processQueuedPayload: jest.fn(async () => undefined),
  };

  let tempDir: string;
  let queueStore: EmailForwardQueueStore;
  let worker: EmailForwardWorkerService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    tempDir = mkdtempSync(join(tmpdir(), 'email-reciever-queue-'));

    const configMap = {
      'queue.dbPath': join(tempDir, 'email-forward-queue.sqlite'),
      'queue.workerEnabled': false,
      'queue.retryDelayMs': 5000,
      'queue.staleTimeoutMs': 300000,
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        EmailForwardQueueStore,
        EmailForwardWorkerService,
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: EmailForwardProcessorService, useValue: mockProcessor },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configMap[key as keyof typeof configMap],
          },
        },
      ],
    }).compile();

    queueStore = moduleRef.get(EmailForwardQueueStore);
    worker = moduleRef.get(EmailForwardWorkerService);
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('processes jobs one by one and deletes successful rows', async () => {
    const now = new Date();

    queueStore.enqueue({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'first@example.com',
          subject: 'First',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '111111',
        },
      ],
    });
    queueStore.enqueue({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'second@example.com',
          subject: 'Second',
          date: new Date('2026-03-30T00:01:00.000Z'),
          text: '222222',
        },
      ],
    });

    expect(queueStore.countJobs()).toBe(2);

    await worker.processNextJob(new Date(now.getTime() + 1000));

    expect(mockProcessor.processQueuedPayload).toHaveBeenCalledTimes(1);
    expect(mockProcessor.processQueuedPayload).toHaveBeenCalledWith({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'first@example.com',
          subject: 'First',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '111111',
        },
      ],
    });
    expect(queueStore.countJobs()).toBe(1);

    await worker.processNextJob(new Date(now.getTime() + 2000));
    expect(queueStore.countJobs()).toBe(0);
  });

  it('requeues failed jobs with incremented attempt metadata', async () => {
    const now = new Date();
    mockProcessor.processQueuedPayload.mockRejectedValueOnce(new Error('processor failed'));

    queueStore.enqueue({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'test@example.com',
          subject: 'Netflix OTP',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '123456',
        },
      ],
    });

    await worker.processNextJob(new Date(now.getTime() + 1000));

    const [job] = queueStore.getJobs();
    expect(job.status).toBe('PENDING');
    expect(job.attempt).toBe(1);
    expect(job.last_error).toBe('processor failed');
    expect(queueStore.countJobs()).toBe(1);
  });

  it('recovers stale processing jobs', () => {
    const now = new Date();

    queueStore.enqueue({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'test@example.com',
          subject: 'Netflix OTP',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '123456',
        },
      ],
    });

    const claimedJob = queueStore.claimNextJob(now);
    expect(claimedJob?.status).toBe('PROCESSING');

    const recovered = worker.recoverStaleJobs(new Date(now.getTime() + 300001));
    const [job] = queueStore.getJobs();

    expect(recovered).toBe(1);
    expect(job.status).toBe('PENDING');
    expect(job.attempt).toBe(1);
    expect(job.started_at).toBeNull();
  });
});
