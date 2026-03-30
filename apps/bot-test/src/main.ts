import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { io, type Socket } from 'socket.io-client';

type ConnectionType = 'BOT' | 'WEB';
type TaskStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'FAILED' | 'REJECTED';

interface DispatchTaskData {
  taskId: string;
  module?: string;
  type?: string;
  executeAt?: string;
  payload?: unknown;
}

interface EventData {
  eventName: string;
  payload: unknown;
}

interface TaskRecord {
  taskId: string;
  status: TaskStatus;
  receivedAt: string;
  updatedAt: string;
  module?: string;
  type?: string;
  executeAt?: string;
  payload?: unknown;
  message?: string;
}

interface EventRecord {
  eventName: string;
  payload: unknown;
  receivedAt: string;
}

interface HistoryRecord {
  direction: 'inbound' | 'outbound' | 'system';
  event: string;
  payload: unknown;
  at: string;
}

interface ModeState {
  autoAccept: boolean;
  autoCompleteMs: number | null;
  autoReject: string | null;
}

interface JsonBody {
  [key: string]: unknown;
}

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL ?? 'http://localhost:3100';
const BOT_TEST_TOKEN = process.env.BOT_TEST_TOKEN ?? '';
const BOT_TEST_NAME = process.env.BOT_TEST_NAME ?? 'bot-test-1';
const BOT_TEST_CONNECTION_TYPE = (process.env.BOT_TEST_CONNECTION_TYPE?.toUpperCase() === 'WEB' ? 'WEB' : 'BOT') as ConnectionType;
const BOT_TEST_HTTP_PORT = Number.parseInt(process.env.BOT_TEST_HTTP_PORT ?? '3201', 10);

const mode: ModeState = {
  autoAccept: parseBoolean(process.env.BOT_TEST_AUTO_ACCEPT, false),
  autoCompleteMs: parseOptionalNumber(process.env.BOT_TEST_AUTO_COMPLETE_MS),
  autoReject: parseOptionalString(process.env.BOT_TEST_AUTO_REJECT),
};

let socket: Socket | null = null;
let clientId: string | null = null;
let connected = false;
let lastError: string | null = null;
const taskMap = new Map<string, TaskRecord>();
const eventLog: EventRecord[] = [];
const history: HistoryRecord[] = [];
const subscriptions = new Set<string>();

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalString(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function now() {
  return new Date().toISOString();
}

function trimArray<T>(array: T[], max = 100) {
  if (array.length > max) {
    array.splice(0, array.length - max);
  }
}

function logLine(message: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`[bot-test] ${message}`);
    return;
  }

  console.log(`[bot-test] ${message}`, payload);
}

function recordHistory(direction: HistoryRecord['direction'], event: string, payload: unknown) {
  history.push({
    direction,
    event,
    payload,
    at: now(),
  });
  trimArray(history, 200);
}

function getTask(taskId: string) {
  return taskMap.get(taskId);
}

function upsertTask(task: DispatchTaskData, status: TaskStatus, message?: string) {
  const current = taskMap.get(task.taskId);
  const next: TaskRecord = {
    taskId: task.taskId,
    status,
    receivedAt: current?.receivedAt ?? now(),
    updatedAt: now(),
    module: task.module ?? current?.module,
    type: task.type ?? current?.type,
    executeAt: task.executeAt ?? current?.executeAt,
    payload: task.payload ?? current?.payload,
    message: message ?? current?.message,
  };
  taskMap.set(task.taskId, next);
  return next;
}

function emitSocketEvent(event: string, payload: unknown) {
  if (!socket || !connected) {
    throw new Error('Socket client is not connected');
  }

  socket.emit(event, payload);
  recordHistory('outbound', event, payload);
  logLine(`outbound:${event}`, payload);
}

function scheduleAutoFlow(task: DispatchTaskData) {
  if (mode.autoReject) {
    const payload = { taskId: task.taskId, message: mode.autoReject };
    upsertTask(task, 'REJECTED', mode.autoReject);
    emitSocketEvent('task-reject', payload);
    return;
  }

  if (mode.autoAccept) {
    upsertTask(task, 'ACCEPTED');
    emitSocketEvent('task-accept', { taskId: task.taskId });
  }

  if (mode.autoCompleteMs !== null) {
    setTimeout(() => {
      if (!connected) {
        return;
      }

      const current = getTask(task.taskId);
      if (!current || ['COMPLETED', 'FAILED', 'REJECTED'].includes(current.status)) {
        return;
      }

      upsertTask(task, 'COMPLETED');
      emitSocketEvent('task-done', {
        taskId: task.taskId,
        status: 'COMPLETED',
      });
    }, mode.autoCompleteMs);
  }
}

function registerSocketHandlers(client: Socket) {
  client.on('connect', () => {
    connected = true;
    clientId = client.id ?? null;
    lastError = null;
    recordHistory('system', 'connect', { clientId: client.id });
    logLine(`connected as ${client.id}`);
  });

  client.on('disconnect', (reason) => {
    connected = false;
    recordHistory('system', 'disconnect', { reason });
    logLine(`disconnected: ${reason}`);
  });

  client.on('connect_error', (error: Error & { data?: unknown }) => {
    connected = false;
    lastError = error.message;
    recordHistory('system', 'connect_error', {
      message: error.message,
      data: error.data,
    });
    logLine(`connect_error: ${error.message}`, error.data);
  });

  client.on('task-dispatch', (payload: DispatchTaskData) => {
    upsertTask(payload, 'PENDING');
    recordHistory('inbound', 'task-dispatch', payload);
    logLine('inbound:task-dispatch', payload);
    scheduleAutoFlow(payload);
  });

  client.on('event', (payload: EventData) => {
    eventLog.push({
      eventName: payload.eventName,
      payload: payload.payload,
      receivedAt: now(),
    });
    trimArray(eventLog, 100);
    recordHistory('inbound', 'event', payload);
    logLine('inbound:event', payload);
  });

  client.on('subscribe-event-error', (payload: unknown) => {
    recordHistory('inbound', 'subscribe-event-error', payload);
    logLine('inbound:subscribe-event-error', payload);
  });

  client.on('unsubscribe-event-error', (payload: unknown) => {
    recordHistory('inbound', 'unsubscribe-event-error', payload);
    logLine('inbound:unsubscribe-event-error', payload);
  });
}

async function connectSocket() {
  if (socket?.connected) {
    return {
      connected: true,
      clientId,
    };
  }

  if (!BOT_TEST_TOKEN) {
    throw new Error('BOT_TEST_TOKEN is required before connecting');
  }

  const client = io(SOCKET_SERVER_URL, {
    auth: {
      token: BOT_TEST_TOKEN,
    },
    query: {
      connection_name: BOT_TEST_NAME,
      connection_type: BOT_TEST_CONNECTION_TYPE,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket = client;
  registerSocketHandlers(client);

  return await new Promise<{ connected: boolean; clientId: string | null }>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve({
        connected: true,
        clientId,
      });
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      client.off('connect', onConnect);
      client.off('connect_error', onError);
    };

    client.once('connect', onConnect);
    client.once('connect_error', onError);
  });
}

function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket.removeAllListeners();
  socket = null;
  connected = false;
  clientId = null;
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) {
    return {};
  }

  return JSON.parse(text) as JsonBody;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload, null, 2));
}

function getStatusPayload() {
  return {
    connected,
    clientId,
    socketServerUrl: SOCKET_SERVER_URL,
    name: BOT_TEST_NAME,
    connectionType: BOT_TEST_CONNECTION_TYPE,
    subscriptions: Array.from(subscriptions),
    mode,
    taskCount: taskMap.size,
    eventCount: eventLog.length,
    lastError,
    recentHistory: history.slice(-20),
  };
}

async function handlePost(pathname: string, body: JsonBody, res: ServerResponse) {
  if (pathname === '/connect') {
    const result = await connectSocket();
    sendJson(res, 200, { success: true, ...result });
    return;
  }

  if (pathname === '/disconnect') {
    disconnectSocket();
    sendJson(res, 200, { success: true });
    return;
  }

  if (pathname === '/task/accept') {
    const taskId = String(body.taskId ?? '');
    if (!taskId) {
      sendJson(res, 400, { success: false, message: 'taskId is required' });
      return;
    }

    const task = getTask(taskId);
    upsertTask({ taskId, ...task }, 'ACCEPTED');
    emitSocketEvent('task-accept', { taskId });
    sendJson(res, 200, { success: true });
    return;
  }

  if (pathname === '/task/reject') {
    const taskId = String(body.taskId ?? '');
    const message = String(body.message ?? 'Rejected by bot-test');
    if (!taskId) {
      sendJson(res, 400, { success: false, message: 'taskId is required' });
      return;
    }

    const task = getTask(taskId);
    upsertTask({ taskId, ...task }, 'REJECTED', message);
    emitSocketEvent('task-reject', { taskId, message });
    sendJson(res, 200, { success: true });
    return;
  }

  if (pathname === '/task/done') {
    const taskId = String(body.taskId ?? '');
    const status = body.status === 'FAILED' ? 'FAILED' : 'COMPLETED';
    const message = typeof body.message === 'string' ? body.message : undefined;
    if (!taskId) {
      sendJson(res, 400, { success: false, message: 'taskId is required' });
      return;
    }

    const task = getTask(taskId);
    upsertTask({ taskId, ...task }, status, message);
    emitSocketEvent('task-done', { taskId, status, message });
    sendJson(res, 200, { success: true });
    return;
  }

  if (pathname === '/subscribe') {
    const eventName = String(body.eventName ?? '');
    if (!eventName) {
      sendJson(res, 400, { success: false, message: 'eventName is required' });
      return;
    }

    emitSocketEvent('subscribe-event', { eventName });
    subscriptions.add(eventName);
    sendJson(res, 200, { success: true, eventName });
    return;
  }

  if (pathname === '/unsubscribe') {
    const eventName = String(body.eventName ?? '');
    if (!eventName) {
      sendJson(res, 400, { success: false, message: 'eventName is required' });
      return;
    }

    emitSocketEvent('unsubscribe-event', { eventName });
    subscriptions.delete(eventName);
    sendJson(res, 200, { success: true, eventName });
    return;
  }

  if (pathname === '/mode') {
    if (typeof body.autoAccept === 'boolean') {
      mode.autoAccept = body.autoAccept;
    }

    if (body.autoCompleteMs === null) {
      mode.autoCompleteMs = null;
    }
    else if (typeof body.autoCompleteMs === 'number' && Number.isFinite(body.autoCompleteMs)) {
      mode.autoCompleteMs = body.autoCompleteMs;
    }

    if (body.autoReject === null) {
      mode.autoReject = null;
    }
    else if (typeof body.autoReject === 'string') {
      mode.autoReject = body.autoReject.trim() || null;
    }

    recordHistory('system', 'mode-update', mode);
    sendJson(res, 200, { success: true, mode });
    return;
  }

  sendJson(res, 404, { success: false, message: `Unknown route ${pathname}` });
}

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/status') {
      sendJson(res, 200, getStatusPayload());
      return;
    }

    if (req.method === 'GET' && url.pathname === '/tasks') {
      sendJson(res, 200, {
        success: true,
        tasks: Array.from(taskMap.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/events') {
      sendJson(res, 200, {
        success: true,
        events: [...eventLog].reverse(),
      });
      return;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      await handlePost(url.pathname, body, res);
      return;
    }

    sendJson(res, 404, { success: false, message: `Unknown route ${url.pathname}` });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    lastError = message;
    sendJson(res, 500, { success: false, message });
  }
}

const server = createServer((req, res) => {
  void requestHandler(req, res);
});

server.listen(BOT_TEST_HTTP_PORT, '0.0.0.0', () => {
  logLine(`control server listening on http://0.0.0.0:${BOT_TEST_HTTP_PORT}`);
  logLine(`socket target: ${SOCKET_SERVER_URL}`);
  logLine(`identity: ${BOT_TEST_NAME} (${BOT_TEST_CONNECTION_TYPE})`);
  logLine(`auto mode`, mode);
});

if (BOT_TEST_TOKEN) {
  void connectSocket().catch((error) => {
    lastError = error instanceof Error ? error.message : String(error);
    logLine(`initial connect failed: ${lastError}`);
  });
}
else {
  logLine('BOT_TEST_TOKEN missing, waiting for manual /connect');
}
