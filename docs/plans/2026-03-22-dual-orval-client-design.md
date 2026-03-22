# Dual Orval Client: Server Fetch + Client useFetcher Hooks

## Problem

Components use `useFetcher` with hardcoded intent strings, route paths, and untyped payloads to make API mutations. This is error-prone (typos silently fail), not discoverable (no autocomplete), and requires hand-written resource routes for each group of endpoints.

## Solution

Generate **two Orval clients** from the same OpenAPI spec:

1. **Server-side fetch client** (existing) — async functions used in route loaders/actions
2. **Client-side useFetcher hooks** (new) — typed React hooks for components

A **single generic proxy route** (`/api/proxy`) handles auth injection and forwarding for all hook submissions, eliminating per-endpoint resource routes.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Component                                                │
│   const { submit, state } = useStartUserBookingCurrent() │
│   submit({ orgId, body: { projectId, tags, start } })    │
└──────────────┬───────────────────────────────────────────┘
               │ useFetcher.submit(JSON, { action: "/api/proxy" })
               ▼
┌──────────────────────────────────────────────────────────┐
│ /api/proxy  (single resource route)                      │
│   • Reads JSON: { url, method, body?, skipAuth? }        │
│   • If !skipAuth: requireUser + inject auth headers      │
│   • Forwards to backend via lasiusFetch                  │
│   • Returns response                                     │
└──────────────┬───────────────────────────────────────────┘
               │ lasiusFetch(url, { method, body, headers })
               ▼
┌──────────────────────────────────────────────────────────┐
│ Backend API  (unchanged)                                 │
└──────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Upgrade Orval to v8** — frontend_rr7 currently uses v7.21.0, but the Next.js project already uses v8.5.3. The custom `client: Function` API may differ between versions. Upgrade before implementing the custom client builder.
- **Backend running** — the spec is fetched live from `http://localhost:9000/backend/assets/swagger.json`, so the backend must be running when `yarn orval` is executed.

## Orval Config

Two output targets sharing the same input spec and model types:

```js
// orval.config.mjs
import { fetcherClientBuilder } from './app/services/api/orval-fetcher-client.ts'

const input = { target: 'http://localhost:9000/backend/assets/swagger.json' }

export default {
  // Existing: server-side fetch client (loaders/actions)
  lasius: {
    input,
    output: {
      client: 'fetch',
      mode: 'tags-split',
      target: './app/services/api/lasius/',
      schemas: './app/services/api/lasius/',
      override: {
        mutator: {
          name: 'lasiusFetch',
          path: './app/services/api/lasius-fetch-instance.ts',
        },
      },
    },
  },

  // New: client-side useFetcher hooks
  lasiusHooks: {
    input,
    output: {
      client: fetcherClientBuilder,
      mode: 'tags-split',
      target: './app/services/api/lasius-hooks/',
      schemas: './app/services/api/lasius/', // reuse model types, no duplication
    },
  },
}
```

## Custom Orval Client Builder

Orval's `client` option accepts a `String | Function`. The function form returns a builder with three properties:

```ts
type ClientBuilder = {
  client: (verbOptions, options) => { implementation: string; imports: Import[] }
  header: (params) => string
  dependencies: Dependency[]
}
```

This is the same mechanism used by `@orval/swr` and `@orval/query` to generate hooks. Our builder generates `useFetcher`-based hooks instead of SWR hooks.

### Builder: `orval-fetcher-client.ts`

The builder function receives per-endpoint metadata from Orval (`verbOptions`):
- `operationName` — e.g. `startUserBookingCurrent`
- `verb` — HTTP method (GET, POST, DELETE, etc.)
- `route` — URL template e.g. `/user-bookings/organisations/${orgId}/bookings/start`
- `body` — body type info (name, definition, implementation)
- `response` — response type info
- `props` — array of path params, query params, body, headers
- `params` — path parameter types

For each endpoint it generates:

```ts
// Generated: POST with body + path params
export function useStartUserBookingCurrent() {
  return useApiProxy<
    startUserBookingCurrentResponse,
    ModelsStartBookingRequest,
    { orgId: string }
  >({
    method: 'POST',
    getUrl: ({ orgId }) =>
      `/user-bookings/organisations/${orgId}/bookings/start`,
  })
}

// Generated: DELETE with path params only, no body
export function useDeleteUserBooking() {
  return useApiProxy<
    deleteUserBookingResponse,
    undefined,
    { orgId: string; bookingId: string }
  >({
    method: 'DELETE',
    getUrl: ({ orgId, bookingId }) =>
      `/user-bookings/organisations/${orgId}/bookings/${bookingId}`,
  })
}

// Generated: GET with path params + query params
export function useGetUserBookingListByOrganisation() {
  return useApiProxy<
    getUserBookingListByOrganisationResponse,
    undefined,
    { orgId: string; params?: GetUserBookingListByOrganisationParams }
  >({
    method: 'GET',
    getUrl: ({ orgId, params }) =>
      getGetUserBookingListByOrganisationUrl(orgId, params),
  })
}

// Generated: GET with no params (public endpoint)
export function useGetConfiguration() {
  return useApiProxy<getConfigurationResponse>({
    method: 'GET',
    getUrl: () => `/config`,
    skipAuth: true, // from OpenAPI spec: no security requirement
  })
}
```

### File header (generated per file):

```ts
import { useApiProxy } from '~/hooks/use-api-proxy'
// + model type imports as needed
```

### Dependencies:

```ts
dependencies: [{ exports: [{ name: 'useFetcher', values: true }], dependency: 'react-router' }]
```

## Generic `useApiProxy` Hook

Hand-written, shared by all generated hooks:

```ts
// app/hooks/use-api-proxy.ts
import { useFetcher } from 'react-router'

type ProxyPayload = {
  url: string
  method: string
  body?: unknown
  skipAuth?: boolean
}

type ApiProxyConfig<TParams> = {
  method: string
  getUrl: (params: TParams) => string
  skipAuth?: boolean
}

type SubmitArgs<TBody, TParams> =
  TParams &
  (TBody extends undefined ? { body?: never } : { body: TBody }) &
  { skipAuth?: boolean }

export function useApiProxy<
  TResponse,
  TBody = undefined,
  TParams = Record<string, never>,
>(config: ApiProxyConfig<TParams>) {
  const fetcher = useFetcher()

  const submit = (
    args: SubmitArgs<TBody, TParams> = {} as SubmitArgs<TBody, TParams>,
  ) => {
    const { body, skipAuth, ...params } = args as Record<string, unknown>

    const payload: ProxyPayload = {
      url: config.getUrl(params as TParams),
      method: config.method,
      ...(body !== undefined && { body }),
      ...(skipAuth ?? config.skipAuth ? { skipAuth: true } : {}),
    }

    fetcher.submit(payload, {
      action: '/api/proxy',
      method: 'POST',
      encType: 'application/json',
    })
  }

  return {
    submit,
    state: fetcher.state,
    data: fetcher.data as TResponse | undefined,
  }
}
```

## Proxy Resource Route

Single hand-written route that handles all API forwarding:

```ts
// app/routes/api.proxy.ts
import { data } from 'react-router'
import { lasiusFetch } from '~/services/api/lasius-fetch-instance'
import {
  authHeadersWithCsrf,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

export async function action({ request }: { request: Request }) {
  const json = await request.json()
  const { url, method, body, skipAuth } = json as {
    url: string
    method: string
    body?: unknown
    skipAuth?: boolean
  }

  if (!url || !method) {
    return data({ error: 'Missing url or method' }, { status: 400 })
  }

  let headers: Record<string, string> = {}
  let authResult

  if (!skipAuth) {
    authResult = await requireUser(request)
    headers = await authHeadersWithCsrf(authResult.session)
  }

  const result = await lasiusFetch(url, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  return data(result, {
    headers: authResult ? mergeAuthHeaders(authResult) : {},
  })
}
```

## Auth Handling

- **Default:** proxy requires authentication (calls `requireUser` + injects JWT/CSRF headers)
- **Opt-out:** endpoints without `security` in the OpenAPI spec get `skipAuth: true` baked into the generated hook
- **Runtime override:** components can pass `skipAuth: true` in the submit args
- Currently only `/config` and `/csrf-token` are public (no security requirement in spec)

## Custom Composite Hooks

Business logic that spans multiple API calls stays as hand-written hooks that compose the generated ones:

```ts
// app/features/bookings/hooks/use-stop-and-start-booking.ts
import { useStopUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings'
import { useStartUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings'

export function useStopAndStartBooking() {
  const stop = useStopUserBookingCurrent()
  const start = useStartUserBookingCurrent()

  const submit = async (args: {
    orgId: string
    currentBookingId: string
    projectId: string
    tags: ModelsTag[]
    start: string
  }) => {
    stop.submit({
      orgId: args.orgId,
      bookingId: args.currentBookingId,
      body: { end: args.start },
    })
    // Start fires after stop completes (watch stop.state)
  }

  return { submit, state: stop.state === 'idle' ? start.state : stop.state }
}
```

Similarly, the midnight-spanning stop logic would be a custom hook composing `useStopUserBookingCurrent` + `useAddUserBookingByOrganisation`.

## What Gets Replaced

| Current | New |
|---------|-----|
| `api.bookings.ts` (7-intent dispatch) | `api.proxy.ts` (generic) + generated hooks |
| `api.org-switch.ts` | `api.proxy.ts` + `useUpdateUserSettings()` |
| `api.theme.ts` | Stays as-is (cookie-only, no backend call) |
| Hardcoded `fetcher.submit({intent: '...'})` | `const { submit } = useDeleteUserBooking()` |
| Manual `JSON.stringify(tags)` | Hooks accept native Orval types, JSON encoding automatic |

## File Structure

```
app/
  hooks/
    use-api-proxy.ts                        # Generic proxy hook (hand-written)
  routes/
    api.proxy.ts                            # Proxy resource route (hand-written)
    api.theme.ts                            # Stays (cookie-only, no backend)
  services/api/
    orval-fetcher-client.ts                 # Custom Orval client builder
    lasius-fetch-instance.ts                # Existing server mutator (unchanged)
    lasius/                                 # Server-side client (generated, unchanged)
    lasius-hooks/                           # useFetcher hooks (generated, DO NOT EDIT)
      user-bookings.ts
      user-favorites.ts
      general.ts
      organisations.ts
      ...
```

## Component Usage — Before & After

### Before (hardcoded strings, untyped):
```tsx
const fetcher = useFetcher()
fetcher.submit(
  { bookingId: item.id, intent: 'delete', orgId: selectedOrgId },
  { action: '/api/bookings', method: 'POST' },
)
```

### After (typed, generated):
```tsx
const { submit, state } = useDeleteUserBooking()
submit({ orgId: selectedOrgId, bookingId: item.id })
```

## Security Considerations

- The proxy route validates `url` starts with `/` (relative path only) to prevent SSRF
- Auth headers are injected server-side, never exposed to the client
- `skipAuth` only skips auth header injection — it doesn't bypass any backend security
- The proxy does not allow arbitrary headers from the client

## Acceptance Criteria

1. `yarn orval` generates both server-side functions and client-side hooks from one command
2. Generated hooks provide full type safety: path params, body types, response types
3. All existing `useFetcher` call sites can be replaced with generated hooks
4. Custom composite hooks (stop-and-start, midnight split) compose generated hooks
5. No hardcoded intent strings, route paths, or manual JSON serialization in components
6. `yarn check` passes with no type errors
7. Public endpoints (config, csrf) work without auth
