import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import type { Socket as ClientSocket } from 'socket.io-client';
import * as process from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io } from 'socket.io-client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TASK_QUEUE_REPOSITORY, TENANT_REPOSITORY } from '../src/constants/database.const';
import { PostgresProvider } from '../src/database/postgres.provider';
import { TokenProvider } from '../src/modules/utility/token.provider';

jest.setTimeout(15000);

const INTERNAL_SECRET = 'test-internal-secret';
const DEFAULT_TENANT_ID = 'tenant-alpha';

function createTransaction() {
  return {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
}

async function waitFor(assertion: () => void, timeoutMs = 2000) {
  const startedAt = Date.now();
  let lastError: Error | undefined;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    }
    catch (error) {
      lastError = error as Error;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }

  throw lastError ?? new Error('Timed out waiting for assertion');
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildToken(tenantId: string) {
  return `tenant:${tenantId}`;
}

describe('Socket app API-usage contract (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let moduleFixture: TestingModule;
  const clients: ClientSocket[] = [];

  const mockPostgresProvider = {
    transaction: jest.fn(async () => createTransaction()),
    setSchema: jest.fn(async () => undefined),
  };

  const mockTenantRepository = {
    findOne: jest.fn(async ({ where }: { where?: { id?: string } }) => {
      if (!where?.id || where.id === 'missing-tenant') {
        return null;
      }

      return {
        dataValues: {
          id: where.id,
          secret: 'tenant-secret',
        },
      };
    }),
  };

  const mockTaskQueueRepository = {
    update: jest.fn(async () => [1]),
  };

  const mockTokenProvider = {
    decodeJwt: jest.fn((token: string) => {
      if (token.startsWith('tenant:')) {
        return { tenant_id: token.slice('tenant:'.length) };
      }

      return { tenant_id: DEFAULT_TENANT_ID };
    }),
    verifyJwt: jest.fn(async (_secret: string, token: string) => {
      if (token === 'reject-token') {
        const error = new Error('Token invalid');
        error.name = 'JsonWebTokenError';
        throw error;
      }

      return { tenant_id: DEFAULT_TENANT_ID };
    }),
  };

  async function bootApp() {
    process.env.SOCKET_INTERNAL_SECRET = INTERNAL_SECRET;
    process.env.PORT = '0';

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresProvider)
      .useValue(mockPostgresProvider)
      .overrideProvider(TENANT_REPOSITORY)
      .useValue(mockTenantRepository)
      .overrideProvider(TASK_QUEUE_REPOSITORY)
      .useValue(mockTaskQueueRepository)
      .overrideProvider(TokenProvider)
      .useValue(mockTokenProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  }

  async function closeClients() {
    while (clients.length) {
      const client = clients.pop();
      if (!client) {
        continue;
      }

      if (client.connected) {
        client.disconnect();
      }
      else {
        client.close();
      }
    }

    await delay(25);
  }

  function postInternal(path: string, body: object) {
    return request(baseUrl)
      .post(`/internal/${path}`)
      .set('x-internal-secret', INTERNAL_SECRET)
      .send(body);
  }

  function getInternal(path: string) {
    return request(baseUrl)
      .get(`/internal/${path}`)
      .set('x-internal-secret', INTERNAL_SECRET);
  }

  async function connectClient(options: {
    tenantId?: string;
    token?: string;
    name?: string;
    type?: 'BOT' | 'WEB';
  } = {}) {
    const tenantId = options.tenantId ?? DEFAULT_TENANT_ID;
    const token = Object.prototype.hasOwnProperty.call(options, 'token')
      ? options.token
      : buildToken(tenantId);
    const name = options.name ?? 'test-client';
    const type = options.type ?? 'BOT';

    return await new Promise<ClientSocket>((resolve, reject) => {
      const client = io(baseUrl, {
        auth: token === undefined ? {} : { token },
        query: {
          connection_name: name,
          connection_type: type,
        },
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
      });

      clients.push(client);

      client.once('connect', () => resolve(client));
      client.once('connect_error', (error) => {
        client.close();
        reject(error);
      });
    });
  }

  async function waitForEvent<T>(client: ClientSocket, eventName: string, timeoutMs = 2000) {
    return await new Promise<T>((resolve, reject) => {
      let timer: NodeJS.Timeout;
      const handler = (payload: T) => {
        clearTimeout(timer);
        client.off(eventName, handler);
        resolve(payload);
      };

      timer = setTimeout(() => {
        client.off(eventName, handler);
        reject(new Error(`Timed out waiting for ${eventName}`));
      }, timeoutMs);

      client.on(eventName, handler);
    });
  }

  async function expectNoEvent(client: ClientSocket, eventName: string, timeoutMs = 300) {
    const result = await new Promise<{ received: boolean; payload?: unknown }>((resolve) => {
      let timer: NodeJS.Timeout;
      const handler = (payload: unknown) => {
        clearTimeout(timer);
        client.off(eventName, handler);
        resolve({ received: true, payload });
      };

      timer = setTimeout(() => {
        client.off(eventName, handler);
        resolve({ received: false });
      }, timeoutMs);

      client.on(eventName, handler);
    });

    expect(result.received).toBe(false);
  }

  beforeAll(async () => {
    await bootApp();
  });

  afterEach(async () => {
    await closeClients();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeClients();
    await app.close();
  });

  it('rejects internal HTTP calls without x-internal-secret', async () => {
    await request(baseUrl)
      .post('/internal/events/send')
      .send({ eventName: 'email:otp', payload: { code: '123456' } })
      .expect(401);
  });

  it('accepts internal HTTP calls with x-internal-secret', async () => {
    await postInternal('events/send', {
      eventName: 'email:otp',
      payload: { code: '123456' },
    })
      .expect(201)
      .expect({ success: true });
  });

  it('connects valid websocket clients and exposes the connection summary over the internal API', async () => {
    const bot = await connectClient({
      tenantId: 'tenant-summary',
      name: 'bot-summary',
      type: 'BOT',
    });

    const response = await getInternal(`connections/${bot.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: bot.id,
      name: 'bot-summary',
      tenant_id: 'tenant-summary',
      type: 'BOT',
      inflight: 0,
    });
    expect(typeof response.body.connectedAt).toBe('number');
  });

  it('rejects websocket handshakes when auth is missing or token verification fails', async () => {
    await expect(connectClient({
      token: undefined,
    })).rejects.toMatchObject({
      message: 'ValidationError',
    });

    await expect(connectClient({
      token: 'reject-token',
    })).rejects.toMatchObject({
      message: 'InvalidTokenError',
    });
  });

  it('dispatches tasks through the internal API using oldest-then-lowest-inflight bot selection', async () => {
    const botOne = await connectClient({
      tenantId: 'tenant-dispatch',
      name: 'bot-one',
      type: 'BOT',
    });

    await delay(50);

    const botTwo = await connectClient({
      tenantId: 'tenant-dispatch',
      name: 'bot-two',
      type: 'BOT',
    });

    const firstDispatchPromise = waitForEvent<{
      taskId: string;
      module?: string;
      type?: string;
      payload?: { email: string };
    }>(botOne, 'task-dispatch');

    const firstResponse = await postInternal('tasks/dispatch', {
      taskId: 'task-1',
      tenantId: 'tenant-dispatch',
      dispatchTaskData: {
        module: 'netflix',
        type: 'resetPassword',
        payload: { email: 'first@example.com' },
      },
    })
      .expect(201);

    expect(firstResponse.body).toEqual({ clientId: botOne.id });
    await expect(firstDispatchPromise).resolves.toEqual({
      taskId: 'task-1',
      module: 'netflix',
      type: 'resetPassword',
      payload: { email: 'first@example.com' },
    });

    botOne.emit('task-accept', { taskId: 'task-1' });

    await waitFor(() => {
      expect(mockTaskQueueRepository.update).toHaveBeenCalledWith(
        { status: 'DISPATCHED' },
        expect.objectContaining({
          where: { id: 'task-1' },
        }),
      );
    });

    const secondDispatchPromise = waitForEvent<{
      taskId: string;
      module?: string;
      type?: string;
      payload?: { email: string };
    }>(botTwo, 'task-dispatch');

    const secondResponse = await postInternal('tasks/dispatch', {
      taskId: 'task-2',
      tenantId: 'tenant-dispatch',
      dispatchTaskData: {
        module: 'netflix',
        type: 'resetPassword',
        payload: { email: 'second@example.com' },
      },
    })
      .expect(201);

    expect(secondResponse.body).toEqual({ clientId: botTwo.id });
    await expect(secondDispatchPromise).resolves.toEqual({
      taskId: 'task-2',
      module: 'netflix',
      type: 'resetPassword',
      payload: { email: 'second@example.com' },
    });
  });

  it('returns null and marks the task as failed when no bot is available', async () => {
    const response = await postInternal('tasks/dispatch', {
      taskId: 'task-no-bot',
      tenantId: 'tenant-empty',
      dispatchTaskData: {
        module: 'netflix',
        type: 'resetPassword',
      },
    })
      .expect(201);

    expect(response.body).toEqual({ clientId: null });
    expect(mockTaskQueueRepository.update).toHaveBeenCalledWith(
      {
        status: 'FAILED',
        error_message: 'no bot available to handle the task',
      },
      expect.objectContaining({
        where: { id: 'task-no-bot' },
      }),
    );
  });

  it('publishes events only to subscribed clients and stops after unsubscribe', async () => {
    const webClient = await connectClient({
      tenantId: 'tenant-events',
      name: 'dashboard',
      type: 'WEB',
    });

    const subscribeResponse = await postInternal('subscriptions/subscribe', {
      clientId: webClient.id,
      eventName: 'user@example.com:NETFLIX_OTP',
    })
      .expect(201);

    expect(subscribeResponse.body).toEqual({ success: true });

    const firstEventPromise = waitForEvent<{
      eventName: string;
      payload: { code: string };
    }>(webClient, 'event');

    await postInternal('events/send', {
      eventName: 'user@example.com:NETFLIX_OTP',
      payload: { code: '123456' },
    })
      .expect(201)
      .expect({ success: true });

    await expect(firstEventPromise).resolves.toEqual({
      eventName: 'user@example.com:NETFLIX_OTP',
      payload: { code: '123456' },
    });

    const unsubscribeResponse = await postInternal('subscriptions/unsubscribe', {
      clientId: webClient.id,
      eventName: 'user@example.com:NETFLIX_OTP',
    })
      .expect(201);

    expect(unsubscribeResponse.body).toEqual({ success: true });

    const noEventPromise = expectNoEvent(webClient, 'event');

    await postInternal('events/send', {
      eventName: 'user@example.com:NETFLIX_OTP',
      payload: { code: '654321' },
    })
      .expect(201);

    await noEventPromise;
  });

  it('updates the task queue when a bot rejects a task', async () => {
    const bot = await connectClient({
      tenantId: 'tenant-reject',
      name: 'bot-reject',
      type: 'BOT',
    });

    bot.emit('task-reject', {
      taskId: 'task-reject',
      message: 'cannot process task',
    });

    await waitFor(() => {
      expect(mockTaskQueueRepository.update).toHaveBeenCalledWith(
        { status: 'FAILED', error_message: 'cannot process task' },
        expect.objectContaining({
          where: { id: 'task-reject' },
        }),
      );
    });
  });

  it('updates the task queue when a bot completes a task', async () => {
    const bot = await connectClient({
      tenantId: 'tenant-done',
      name: 'bot-done',
      type: 'BOT',
    });

    bot.emit('task-done', {
      taskId: 'task-done',
      status: 'COMPLETED',
      message: 'finished successfully',
    });

    await waitFor(() => {
      expect(mockTaskQueueRepository.update).toHaveBeenCalledWith(
        { status: 'COMPLETED', error_message: 'finished successfully' },
        expect.objectContaining({
          where: { id: 'task-done' },
        }),
      );
    });
  });
});
