# Custom WebSocket Hook Design

## Problem

`react-use-websocket` is CJS-only, causing SSR interop issues with Vite. Replace with a zero-dependency custom implementation.

## Architecture: Module-level singleton + React hook

```
┌─────────────────────────────────────────────┐
│  websocket-manager.ts (module singleton)    │
│                                             │
│  - One WebSocket instance per URL           │
│  - Reconnection with exponential backoff    │
│  - Ping keepalive timer                     │
│  - Subscriber registry (ref-counted)        │
│  - Window focus listener (active reconnect) │
│  - connect() / disconnect() / send()        │
└──────────────┬──────────────────────────────┘
               │ subscribe/unsubscribe
┌──────────────▼──────────────────────────────┐
│  use-lasius-websocket.ts (React hook)       │
│                                             │
│  - SSR guard (no-op on server)              │
│  - Subscribes on mount, unsubs on unmount   │
│  - Exposes: connectionStatus, lastMessage,  │
│    messageHistory, sendJsonMessage          │
│  - Bounded history (100 messages)           │
│  - JSON parsing of incoming messages        │
└─────────────────────────────────────────────┘
```

## Key Behaviors

| Concern | Implementation |
|---------|---------------|
| Shared connection | Singleton keyed by URL. First subscriber connects, last unsubscriber disconnects. |
| Reconnection | Exponential backoff: `min(2^attempt * 1000, 10000)ms`, max 30 attempts. Counter resets on successful open. |
| Active refocus reconnect | On `visibilitychange` → visible, if socket is closed, immediately attempt reconnect (resets backoff). |
| Ping keepalive | `{ type: 'Ping' }` every 5s while connected. Timer starts on open, stops on close. |
| SSR safety | Hook returns static defaults on server. Manager is never instantiated. |
| Auth | Cookie-based (automatic). Connection setup isolated in a `createWebSocket(url)` factory for future token support. |
| Cleanup | Socket closed + timers cleared when subscriber count hits 0. |
| Error resilience | `onerror` triggers reconnect. `onclose` with non-1000 code triggers reconnect. JSON parse failures return `null`. |

## File Structure

```
app/features/system/websocket/
├── websocket-manager.ts      # singleton connection manager
├── use-lasius-websocket.ts   # React hook
├── use-is-window-focused.ts  # window focus hook
├── type-guards.ts            # event type guards
├── type-guards.test.ts       # tests

app/components/features/system/
├── websocket-status.tsx      # UI component (unchanged)
```

## What Gets Removed

- `react-use-websocket` dependency
- `ssr.optimizeDeps.include` from vite config
- `app/lib/hooks/use-is-window-focused.ts`
- `app/lib/hooks/use-lasius-websocket.ts`
- `app/lib/utils/websocket/` directory
