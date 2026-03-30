# Manual Test Instructions

Use three processes: `apps/socket`, `apps/api`, and `apps/bot-test`.

## Setup

Set these envs first.

For `apps/socket`:

```bash
PORT=3100
SOCKET_INTERNAL_SECRET=socket_internal_secret
```

For `apps/api`:

```bash
PORT=3000
SOCKET_APP_BASE_URL=http://localhost:3100
SOCKET_INTERNAL_SECRET=socket_internal_secret
SOCKET_TEST_MODULE_ENABLED=true
```

For `apps/bot-test`:

```bash
SOCKET_SERVER_URL=http://localhost:3100
BOT_TEST_TOKEN=<valid socket token>
BOT_TEST_NAME=bot-test-1
BOT_TEST_CONNECTION_TYPE=BOT
BOT_TEST_HTTP_PORT=3201
BOT_TEST_AUTO_ACCEPT=true
BOT_TEST_AUTO_COMPLETE_MS=1500
```

Then start them:

```bash
pnpm --filter @volvecapital/socket start:dev
pnpm --filter @volvecapital/api start:dev
pnpm --filter @volvecapital/bot-test dev
```

## 1. Check bot is connected

Get bot-test status:

```bash
curl http://localhost:5201/status
```

If connected, note the `clientId`.

Check via API:

```bash
curl http://localhost:5000/socket-test/connection/<clientId>
```

## 2. Test API -> socket -> bot task dispatch

Dispatch a task through API:

```bash
curl -X POST http://localhost:5000/socket-test/dispatch-task \
  -H 'Content-Type: application/json' \
  -d '{
    "taskId": "task-001",
    "tenantId": "your-tenant-id",
    "dispatchTaskData": {
      "module": "netflix",
      "type": "resetPassword",
      "payload": { "email": "user@example.com" }
    }
  }'
```

Then inspect bot-test:

```bash
curl http://localhost:5201/tasks
curl http://localhost:5201/status
```

If `BOT_TEST_AUTO_ACCEPT=true` and `BOT_TEST_AUTO_COMPLETE_MS=1500`, it should accept and complete automatically.

Manual mode instead:

```bash
curl -X POST http://localhost:5201/mode \
  -H 'Content-Type: application/json' \
  -d '{"autoAccept": false, "autoCompleteMs": null, "autoReject": null}'
```

Then manually respond:

```bash
curl -X POST http://localhost:5201/task/accept \
  -H 'Content-Type: application/json' \
  -d '{"taskId":"task-001"}'

curl -X POST http://localhost:5201/task/done \
  -H 'Content-Type: application/json' \
  -d '{"taskId":"task-001","status":"COMPLETED"}'
```

Or reject:

```bash
curl -X POST http://localhost:5201/task/reject \
  -H 'Content-Type: application/json' \
  -d '{"taskId":"task-001","message":"fake rejection"}'
```

## 3. Test event subscription flow

Subscribe the bot-test client to an event:

```bash
curl -X POST http://localhost:5201/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"eventName":"user@example.com:NETFLIX_OTP"}'
```

Send the event through API:

```bash
curl -X POST http://localhost:5000/socket-test/send-event \
  -H 'Content-Type: application/json' \
  -d '{
    "eventName":"user@example.com:NETFLIX_OTP",
    "payload":{"code":"123456"}
  }'
```

Check bot-test received it:

```bash
curl http://localhost:5201/events
```

Unsubscribe and test again:

```bash
curl -X POST http://localhost:5201/unsubscribe \
  -H 'Content-Type: application/json' \
  -d '{"eventName":"user@example.com:NETFLIX_OTP"}'
```

## 4. Test API-managed subscribe/unsubscribe

If you want API to manage socket subscriptions directly:

```bash
curl -X POST http://localhost:5000/socket-test/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"clientId":"<clientId>","eventName":"user@example.com:NETFLIX_OTP"}'
```

Then send event as above. Unsubscribe with:

```bash
curl -X POST http://localhost:5000/socket-test/unsubscribe \
  -H 'Content-Type: application/json' \
  -d '{"clientId":"<clientId>","eventName":"user@example.com:NETFLIX_OTP"}'
```

## 5. Test failure path

Stop `apps/bot-test` or disconnect it:

```bash
curl -X POST http://localhost:5201/disconnect
```

Then dispatch again:

```bash
curl -X POST http://localhost:5000/socket-test/dispatch-task \
  -H 'Content-Type: application/json' \
  -d '{
    "taskId":"task-no-bot",
    "tenantId":"your-tenant-id",
    "dispatchTaskData":{"module":"netflix","type":"resetPassword"}
  }'
```

You should get `clientId: null`.

## Important

`BOT_TEST_TOKEN` must be a valid socket token for a real tenant, or the socket server will reject the connection.
