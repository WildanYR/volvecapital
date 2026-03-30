# Apps Socket Extraction Plan

## Summary
Create a new standalone app at `apps/socket` that becomes the single Socket.IO broker for all realtime clients. It must preserve the current client socket protocol from `apps/api/src/modules/socket`, own the broker-side connection/subscription/task-state behavior currently in the API gateway, and expose HTTP endpoints so `apps/api` and any other internal app can dispatch tasks or publish events without opening socket connections themselves.

## Key Changes
- Build `apps/socket` as a NestJS app with one Socket.IO gateway, one internal HTTP controller, and one service layer for connection state and dispatch logic.
- Preserve the current client socket contract:
  - handshake auth token in `auth.token`
  - handshake query params `connection_name` and `connection_type`
  - inbound events `task-accept`, `task-reject`, `task-done`, `subscribe-event`, `unsubscribe-event`
  - outbound events `task-dispatch` and `event`
- Move the current gateway logic from API into `apps/socket` with the same behavior for connection tracking, task status updates, bot selection, and event subscriptions.
- Replace direct `SocketGateway` usage inside `apps/api` with an HTTP client facade that exposes `dispatchTask`, `sendEvent`, `subscribeClientToEvent`, and `unsubscribeClientToEvent`.
- Keep `apps/bot2` protocol-compatible and retarget its connector from the API URL to the socket app URL.

## Public Interfaces
- `POST /internal/tasks/dispatch`
- `POST /internal/events/send`
- `POST /internal/subscriptions/subscribe`
- `POST /internal/subscriptions/unsubscribe`
- `GET /internal/connections/:clientId`

## Test Plan
- Verify valid and invalid websocket handshakes.
- Verify `task-accept`, `task-reject`, and `task-done` update task status correctly.
- Verify dispatch chooses the correct bot and returns the selected client id.
- Verify published events only reach subscribed clients.
- Verify API task and email-forward paths work through the new internal HTTP client.

## Assumptions
- `apps/socket` is single-instance for now.
- JWT verification uses a shared secret from `SECRET`.
- Internal HTTP calls are protected by `SOCKET_INTERNAL_SECRET`.
- Socket event names and payloads remain unchanged for client compatibility.
