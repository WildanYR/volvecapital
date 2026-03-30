# `apps/bot-test`

Simple local fake bot/client for the socket server.

## Environment

```bash
SOCKET_SERVER_URL=http://localhost:3100
BOT_TEST_TOKEN=your_socket_token
BOT_TEST_NAME=bot-test-1
BOT_TEST_CONNECTION_TYPE=BOT
BOT_TEST_HTTP_PORT=3201
BOT_TEST_AUTO_ACCEPT=true
BOT_TEST_AUTO_COMPLETE_MS=1500
BOT_TEST_AUTO_REJECT=
```

You can put these values in `apps/bot-test/.env`.

## Run

```bash
pnpm --filter @volvecapital/bot-test dev
```

## HTTP Endpoints

- `POST /connect`
- `POST /disconnect`
- `GET /status`
- `GET /tasks`
- `GET /events`
- `POST /task/accept`
- `POST /task/reject`
- `POST /task/done`
- `POST /subscribe`
- `POST /unsubscribe`
- `POST /mode`

## Example API Flow

1. Start `apps/socket`
2. Start `apps/api` with `SOCKET_TEST_MODULE_ENABLED=true`
3. Start `apps/bot-test`
4. Call `POST /socket-test/dispatch-task` in `apps/api`
5. Inspect `GET /status` or `GET /tasks` on `apps/bot-test`
