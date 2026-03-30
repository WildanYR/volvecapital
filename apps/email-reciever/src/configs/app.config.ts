import { resolve } from 'node:path';
/* eslint-disable node/prefer-global/process */
export function AppConfig() {
  return {
    app: {
      instance_name: process.env.INSTANCE_NAME || 'vc_email_reciever_1',
      port: process.env.PORT ? Number.parseInt(process.env.PORT) : 5200,
      url: process.env.APP_URL ?? 'http://localhost:5200',
    },
    socket: {
      baseUrl: process.env.SOCKET_APP_BASE_URL ?? 'http://localhost:3100',
      internalSecret: process.env.SOCKET_INTERNAL_SECRET,
    },
    queue: {
      dbPath: process.env.EMAIL_QUEUE_DB_PATH
        ? resolve(process.env.EMAIL_QUEUE_DB_PATH)
        : resolve(process.cwd(), 'storage', 'email-forward-queue.sqlite'),
      workerEnabled: process.env.EMAIL_QUEUE_WORKER_ENABLED !== 'false',
      retryDelayMs: Number.parseInt(process.env.EMAIL_QUEUE_RETRY_DELAY_MS || '5000'),
      staleTimeoutMs: Number.parseInt(process.env.EMAIL_QUEUE_STALE_TIMEOUT_MS || '300000'),
    },
  };
}
