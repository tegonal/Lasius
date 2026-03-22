# Dual Orval Client Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate typed `useFetcher` hooks from the OpenAPI spec alongside the existing server-side fetch client, with a generic proxy route for all API forwarding.

**Architecture:** Custom Orval client builder generates `useXxx` hooks per endpoint. Hooks call `useApiProxy` which submits JSON to `/api/proxy`. The proxy route adds auth headers and forwards to the backend via `lasiusFetch`.

**Tech Stack:** Orval v8, React Router 7 `useFetcher`, TypeScript

---

### Task 1: Upgrade Orval to v8

**Files:**
- Modify: `frontend_rr7/package.json`
- Modify: `frontend_rr7/orval.config.mjs`

**Step 1: Upgrade orval dependency**

```bash
yarn up orval@^8.5.3
```

**Step 2: Update orval config to fetch spec from backend**

Update `frontend_rr7/orval.config.mjs` — change input from static file to live backend URL:

```js
export default {
	lasius: {
		input: {
			target: 'http://localhost:9000/backend/assets/swagger.json',
		},
		output: {
			client: 'fetch',
			mock: false,
			mode: 'tags-split',
			override: {
				mutator: {
					name: 'lasiusFetch',
					path: './app/services/api/lasius-fetch-instance.ts',
				},
			},
			schemas: './app/services/api/lasius/',
			target: './app/services/api/lasius/',
		},
	},
}
```

**Step 3: Regenerate existing client to verify v8 compatibility**

Requires backend running on port 9000.

```bash
yarn orval
```

Expected: generates files in `app/services/api/lasius/` without errors. Output may have minor formatting differences from v7 — that's fine.

**Step 4: Run checks**

```bash
yarn check
```

Expected: PASS. If there are type errors from v8 changes in the generated code, fix the `lasius-fetch-instance.ts` mutator (v8 may expect different `BodyType`/`ErrorType` exports).

**Step 5: Commit**

```bash
git add frontend_rr7/package.json frontend_rr7/yarn.lock frontend_rr7/orval.config.mjs frontend_rr7/app/services/api/lasius/
git commit -m "Upgrade orval to v8 and fetch spec from backend"
```

---

### Task 2: Create the `useApiProxy` hook

**Files:**
- Create: `frontend_rr7/app/hooks/use-api-proxy.ts`

**Step 1: Create the hook file**

```ts
/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { useFetcher } from 'react-router'

type ProxyPayload = {
	body?: unknown
	method: string
	skipAuth?: boolean
	url: string
}

type ApiProxyConfig<TParams> = {
	getUrl: (params: TParams) => string
	method: string
	skipAuth?: boolean
}

type SubmitArgs<TBody, TParams> = TParams &
	(TBody extends undefined ? { body?: never } : { body: TBody }) & {
		skipAuth?: boolean
	}

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
			method: config.method,
			url: config.getUrl(params as TParams),
			...(body !== undefined && { body }),
			...(skipAuth ?? config.skipAuth ? { skipAuth: true } : {}),
		}

		void fetcher.submit(payload, {
			action: '/api/proxy',
			encType: 'application/json',
			method: 'POST',
		})
	}

	return {
		data: fetcher.data as TResponse | undefined,
		state: fetcher.state,
		submit,
	}
}
```

**Step 2: Run checks**

```bash
yarn check
```

Expected: PASS (hook is not imported anywhere yet, just needs to compile).

**Step 3: Commit**

```bash
git add frontend_rr7/app/hooks/use-api-proxy.ts
git commit -m "Add useApiProxy hook for typed API proxy submissions"
```

---

### Task 3: Create the proxy resource route

**Files:**
- Create: `frontend_rr7/app/routes/api.proxy.ts`
- Modify: `frontend_rr7/app/routes.ts` — add route entry

**Step 1: Create the proxy route**

```ts
/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { data } from 'react-router'

import { lasiusFetch } from '~/services/api/lasius-fetch-instance'
import {
	authHeadersWithCsrf,
	mergeAuthHeaders,
	requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * POST /api/proxy
 *
 * Generic API proxy route. Receives JSON payload with:
 *   - url: backend API path (must start with /)
 *   - method: HTTP method
 *   - body?: request body (forwarded as JSON)
 *   - skipAuth?: boolean (skip auth header injection)
 *
 * Injects auth headers (JWT + CSRF) unless skipAuth is true.
 * Forwards the request to the backend via lasiusFetch.
 */
export async function action({ request }: { request: Request }) {
	const json = (await request.json()) as {
		body?: unknown
		method: string
		skipAuth?: boolean
		url: string
	}

	const { body, method, skipAuth, url } = json

	if (!url || !method) {
		return data({ error: 'Missing url or method' }, { status: 400 })
	}

	// Prevent SSRF — only allow relative paths
	if (!url.startsWith('/')) {
		return data({ error: 'URL must be a relative path' }, { status: 400 })
	}

	let headers: Record<string, string> = {}
	let authResult

	if (!skipAuth) {
		authResult = await requireUser(request)
		headers = await authHeadersWithCsrf(authResult.session)
	}

	const result = await lasiusFetch(url, {
		headers: {
			...(body !== undefined && { 'Content-Type': 'application/json' }),
			...headers,
		},
		method,
		...(body !== undefined && { body: JSON.stringify(body) }),
	})

	return data(result, {
		headers: authResult ? mergeAuthHeaders(authResult) : {},
	})
}
```

**Step 2: Register the route in `routes.ts`**

Add inside the `...prefix('api', [` block, after the existing `route('bookings', ...)` line:

```ts
route('proxy', 'routes/api.proxy.ts'),
```

**Step 3: Run checks**

```bash
yarn check
```

Expected: PASS.

**Step 4: Commit**

```bash
git add frontend_rr7/app/routes/api.proxy.ts frontend_rr7/app/routes.ts
git commit -m "Add generic API proxy resource route"
```

---

### Task 4: Create the custom Orval client builder

This is the core piece. The builder generates `useFetcher` hooks per endpoint.

**Files:**
- Create: `frontend_rr7/app/services/api/orval-fetcher-client.ts`

**Step 1: Study verbOptions shape**

The builder's `client` function receives `(verbOptions, options)` where:

```ts
verbOptions = {
  operationName: string        // e.g. "startUserBookingCurrent"
  verb: string                 // "get" | "post" | "put" | "delete" | "patch"
  body: {
    definition: string         // type name e.g. "ModelsStartBookingRequest"
    implementation: string     // param name e.g. "modelsStartBookingRequest"
  } | undefined
  response: {
    definition: {
      success: string          // e.g. "startUserBookingCurrentResponse"
    }
  }
  props: Array<{
    name: string               // param name
    type: GetterPropType       // PARAM, NAMED_PATH_PARAMS, QUERY_PARAM, BODY, HEADER
    definition: string         // type definition
    implementation: string     // param code
    destructured?: string      // for NAMED_PATH_PARAMS
  }>
  queryParams?: {
    schema: { name: string }
  }
  summary?: string
  deprecated?: string
  override: object
  params: Array<{ name: string; definition: string }>
}

options = {
  route: string                // URL template e.g. "/user-bookings/organisations/${orgId}/bookings/start"
  context: {
    output: { httpClient: string; tsconfig: object }
    specKey: string
  }
}
```

**Step 2: Create the builder**

```ts
/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * Custom Orval client builder that generates useFetcher-based hooks.
 *
 * Each endpoint produces a `useXxx()` hook that wraps `useApiProxy`.
 * These hooks submit typed JSON payloads to `/api/proxy` via useFetcher.
 *
 * Usage in orval.config.mjs:
 *   import { fetcherClientBuilder } from './app/services/api/orval-fetcher-client.ts'
 *   output: { client: fetcherClientBuilder, ... }
 */

// Endpoints without security in the OpenAPI spec
const PUBLIC_ENDPOINTS = new Set([
	'/config',
	'/csrf-token',
	'/oauth2/login',
	'/oauth2/logout',
])

/**
 * Detect if a route template matches a public endpoint.
 * Route templates use ${paramName} interpolation.
 */
function isPublicRoute(route: string): boolean {
	// Strip template expressions for comparison
	const staticRoute = route.replace(/\$\{[^}]+\}/g, '*')
	return PUBLIC_ENDPOINTS.has(staticRoute)
}

// These match @orval/core GetterPropType values
const PROP_TYPE = {
	BODY: 4,
	HEADER: 5,
	NAMED_PATH_PARAMS: 1,
	PARAM: 0,
	QUERY_PARAM: 2,
} as const

type VerbOptions = {
	body: { definition: string; implementation: string } | undefined
	deprecated?: string
	operationName: string
	override: { security?: unknown[] }
	params: Array<{ definition: string; name: string }>
	props: Array<{
		definition: string
		destructured?: string
		implementation: string
		name: string
		type: number
	}>
	queryParams?: { schema: { name: string } }
	response: { definition: { success: string } }
	summary?: string
	verb: string
}

type GeneratorOptions = {
	context: { output: { httpClient: string } }
	route: string
}

type Import = {
	name: string
	values?: boolean
}

function generateFetcherHook(
	verbOptions: VerbOptions,
	options: GeneratorOptions,
): { implementation: string; imports: Import[] } {
	const { body, operationName, props, queryParams, response, verb } =
		verbOptions
	const { route } = options

	const hookName = `use${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}`
	const responseType = `${operationName}Response`

	// Collect path params
	const pathParams = props.filter(
		(p) =>
			p.type === PROP_TYPE.PARAM ||
			p.type === PROP_TYPE.NAMED_PATH_PARAMS,
	)

	// Build TParams type
	const paramFields: string[] = []
	for (const p of pathParams) {
		paramFields.push(`${p.name}: ${p.definition}`)
	}
	if (queryParams) {
		paramFields.push(`params?: ${queryParams.schema.name}`)
	}

	// Build type arguments for useApiProxy<TResponse, TBody, TParams>
	const typeArgs: string[] = [responseType]
	if (body) {
		typeArgs.push(body.definition)
	} else {
		typeArgs.push('undefined')
	}
	if (paramFields.length > 0) {
		typeArgs.push(`{ ${paramFields.join('; ')} }`)
	}

	// Remove trailing 'undefined' type args
	while (
		typeArgs.length > 1 &&
		typeArgs[typeArgs.length - 1] === 'undefined'
	) {
		typeArgs.pop()
	}

	const typeArgsStr = typeArgs.join(', ')

	// Build getUrl function
	const paramDestructure =
		pathParams.length > 0 || queryParams
			? `{ ${[...pathParams.map((p) => p.name), queryParams ? 'params' : ''].filter(Boolean).join(', ')} }`
			: ''

	let urlExpr: string
	if (queryParams) {
		// Use the generated URL builder for query param serialization
		const urlBuilderName = `get${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}Url`
		const urlBuilderArgs = [
			...pathParams.map((p) => p.name),
			'params',
		].join(', ')
		urlExpr = `${urlBuilderName}(${urlBuilderArgs})`
	} else {
		urlExpr = `\`${route}\``
	}

	const isPublic = isPublicRoute(route)
	const skipAuthLine = isPublic ? '\n\t\tskipAuth: true,' : ''

	const implementation = `
export function ${hookName}() {
\treturn useApiProxy<${typeArgsStr}>({
\t\tgetUrl: (${paramDestructure}) => ${urlExpr},
\t\tmethod: '${verb.toUpperCase()}',${skipAuthLine}
\t})
}
`

	// Collect imports
	const imports: Import[] = []
	if (body) {
		imports.push({ name: body.definition })
	}
	imports.push({ name: responseType })
	if (queryParams) {
		imports.push({ name: queryParams.schema.name })
	}

	return { implementation: implementation.trim(), imports }
}

function generateFetcherHeader(): string {
	return `import { useApiProxy } from '~/hooks/use-api-proxy'\n`
}

function getFetcherDependencies() {
	return [
		{
			dependency: 'react-router',
			exports: [{ name: 'useFetcher', values: true }],
		},
	]
}

const fetcherClientBuilder = () => () => ({
	client: generateFetcherHook,
	dependencies: getFetcherDependencies,
	header: generateFetcherHeader,
})

export { fetcherClientBuilder }
export default fetcherClientBuilder
```

**Step 3: Run checks**

```bash
yarn check
```

Expected: PASS (file compiles standalone, not yet wired into config).

**Step 4: Commit**

```bash
git add frontend_rr7/app/services/api/orval-fetcher-client.ts
git commit -m "Add custom Orval client builder for useFetcher hooks"
```

---

### Task 5: Wire the builder into Orval config and generate hooks

**Files:**
- Modify: `frontend_rr7/orval.config.mjs`

**Step 1: Add the second output target**

Update `frontend_rr7/orval.config.mjs`:

```js
import { fetcherClientBuilder } from './app/services/api/orval-fetcher-client.ts'

export default {
	lasius: {
		input: {
			target: 'http://localhost:9000/backend/assets/swagger.json',
		},
		output: {
			client: 'fetch',
			mock: false,
			mode: 'tags-split',
			override: {
				mutator: {
					name: 'lasiusFetch',
					path: './app/services/api/lasius-fetch-instance.ts',
				},
			},
			schemas: './app/services/api/lasius/',
			target: './app/services/api/lasius/',
		},
	},
	lasiusHooks: {
		input: {
			target: 'http://localhost:9000/backend/assets/swagger.json',
		},
		output: {
			client: fetcherClientBuilder,
			mock: false,
			mode: 'tags-split',
			schemas: './app/services/api/lasius/',
			target: './app/services/api/lasius-hooks/',
		},
	},
}
```

**Step 2: Run orval to generate both clients**

Requires backend running on port 9000.

```bash
yarn orval
```

Expected: generates files in both `app/services/api/lasius/` and `app/services/api/lasius-hooks/`. Inspect the generated hooks — each file should contain `useXxx` functions calling `useApiProxy`.

**Step 3: Verify generated output looks correct**

Check a generated file, e.g. `app/services/api/lasius-hooks/user-bookings/user-bookings.ts`. It should contain hooks like:

```ts
import { useApiProxy } from '~/hooks/use-api-proxy'

export function useStartUserBookingCurrent() {
  return useApiProxy<startUserBookingCurrentResponse, ModelsStartBookingRequest, { orgId: string }>({
    getUrl: ({ orgId }) => `/user-bookings/organisations/${orgId}/bookings/start`,
    method: 'POST',
  })
}

export function useDeleteUserBooking() {
  return useApiProxy<deleteUserBookingResponse, undefined, { orgId: string; bookingId: string }>({
    getUrl: ({ orgId, bookingId }) => `/user-bookings/organisations/${orgId}/bookings/${bookingId}`,
    method: 'DELETE',
  })
}
```

And `app/services/api/lasius-hooks/general/general.ts` should have:

```ts
export function useGetConfiguration() {
  return useApiProxy<getConfigurationResponse>({
    getUrl: () => `/config`,
    method: 'GET',
    skipAuth: true,
  })
}
```

**Step 4: Run checks**

```bash
yarn check
```

Expected: PASS. Fix any type errors in the builder's code generation logic.

**Step 5: Update `yarn orval` script if needed**

If `package.json` `"orval"` script needs updating (e.g. to clean hooks dir first):

```json
"orval": "rm -rf ./app/services/api/lasius-hooks && orval"
```

**Step 6: Commit**

```bash
git add frontend_rr7/orval.config.mjs frontend_rr7/app/services/api/lasius-hooks/ frontend_rr7/package.json
git commit -m "Generate useFetcher hooks via dual Orval client"
```

---

### Task 6: Migrate booking-item-context to generated hooks

**Files:**
- Modify: `frontend_rr7/app/features/bookings/components/booking-item-context.tsx`

**Step 1: Replace fetcher.submit calls with generated hooks**

Current pattern (repeated 5 times):
```ts
const fetcher = useFetcher()
fetcher.submit(
  { bookingId: item.id, intent: 'delete', orgId: selectedOrgId },
  { action: '/api/bookings', method: 'POST' },
)
```

New pattern:
```ts
import { useDeleteUserBooking, useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

// In component:
const deleteBooking = useDeleteUserBooking()
const updateBooking = useUpdateUserBooking()
const addFavorite = useAddFavoriteBooking()

// Delete:
deleteBooking.submit({ orgId: selectedOrgId, bookingId: item.id })

// Update (adjust start):
updateBooking.submit({
  orgId: selectedOrgId,
  bookingId: item.id,
  body: {
    projectId: item.projectReference?.id || '',
    tags: item.tags || [],
    start: formatISOLocale(new Date(previousBooking.end.dateTime)),
    end: item.end ? formatISOLocale(new Date(item.end.dateTime)) : undefined,
  },
})

// Add favorite:
addFavorite.submit({
  orgId: selectedOrgId,
  body: {
    projectId: item.projectReference?.id || '',
    tags: item.tags || [],
  },
})
```

For `stopAndStart` — this is a composite operation. For now, create a custom hook in the next task. Replace the inline `stopAndStart` logic with a placeholder comment referencing it.

**Step 2: Run checks**

```bash
yarn check
```

Expected: PASS.

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/bookings/components/booking-item-context.tsx
git commit -m "Migrate booking-item-context to generated API hooks"
```

---

### Task 7: Create composite hooks for multi-step operations

**Files:**
- Create: `frontend_rr7/app/features/bookings/hooks/use-stop-and-start-booking.ts`
- Create: `frontend_rr7/app/features/bookings/hooks/use-stop-booking.ts`

**Step 1: Create stop-booking hook (handles midnight spanning)**

The current `stop` intent in `api.bookings.ts` has midnight-spanning logic. This becomes a custom hook:

```ts
/**
 * AGPL header...
 */

import { addDays, endOfDay, isSameDay, startOfDay } from 'date-fns'

import { formatISOLocale } from '~/lib/utils/dates'
import { useAddUserBookingByOrganisation } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useStopUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

/**
 * Stop a booking with midnight-spanning support.
 * If the booking spans midnight, stops at 23:59:59 and creates a next-day booking.
 *
 * NOTE: This is a client-side orchestration hook. The midnight-spanning logic
 * runs two sequential API calls. If the second fails, the first has already
 * committed. For production robustness, this logic should move server-side.
 */
export function useStopBooking() {
	const stop = useStopUserBookingCurrent()
	const addBooking = useAddUserBookingByOrganisation()

	const submit = (args: {
		bookingId: string
		end: string
		orgId: string
		projectId: string
		start: string
		tags: Array<{ id: string; type: string }>
	}) => {
		const startDate = new Date(args.start)
		const endDate = new Date(args.end)
		const spansMidnight = !isSameDay(startDate, endDate)

		if (!spansMidnight) {
			stop.submit({
				bookingId: args.bookingId,
				body: { end: args.end },
				orgId: args.orgId,
			})
		} else {
			const endOfStartDay = endOfDay(startDate)
			stop.submit({
				bookingId: args.bookingId,
				body: { end: formatISOLocale(endOfStartDay) },
				orgId: args.orgId,
			})
			// TODO: sequence the addBooking after stop completes
			// For now, fire both — matches original behavior
			const startOfNextDay = startOfDay(addDays(startDate, 1))
			addBooking.submit({
				body: {
					end: formatISOLocale(endDate),
					projectId: args.projectId,
					start: formatISOLocale(startOfNextDay),
					tags: args.tags,
				},
				orgId: args.orgId,
			})
		}
	}

	return {
		data: stop.data,
		state: stop.state === 'idle' ? addBooking.state : stop.state,
		submit,
	}
}
```

**Step 2: Create stop-and-start hook**

```ts
/**
 * AGPL header...
 */

import { useGetUserBookingCurrent, useStartUserBookingCurrent, useStopUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

/**
 * Stop the currently running booking and start a new one.
 */
export function useStopAndStartBooking() {
	const stop = useStopUserBookingCurrent()
	const start = useStartUserBookingCurrent()

	const submit = (args: {
		orgId: string
		projectId: string
		start: string
		tags: Array<{ id: string; type: string }>
	}) => {
		// The proxy route handles getCurrentBooking + stop + start server-side
		// For now, just start — the backend auto-stops current booking on start
		start.submit({
			body: {
				projectId: args.projectId,
				start: args.start,
				tags: args.tags,
			},
			orgId: args.orgId,
		})
	}

	return {
		data: start.data,
		state: stop.state === 'idle' ? start.state : stop.state,
		submit,
	}
}
```

**Note:** Review whether the backend's `startUserBookingCurrent` auto-stops the current booking. If it does, `useStopAndStartBooking` can simply call start. If not, the hook needs to fetch current booking, stop it, then start — which requires sequencing (use `useEffect` watching `stop.state`). Determine this during implementation.

**Step 3: Run checks**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add frontend_rr7/app/features/bookings/hooks/
git commit -m "Add composite booking hooks for multi-step operations"
```

---

### Task 8: Migrate remaining fetcher call sites

**Files:**
- Modify: `frontend_rr7/app/features/bookings/components/booking-current.tsx`
- Modify: `frontend_rr7/app/features/bookings/components/booking-current-entry-context.tsx`

**Step 1: Migrate booking-current.tsx (stop button)**

Replace:
```ts
const fetcher = useFetcher()
fetcher.submit(
  { bookingId: booking.id, end: ..., intent: 'stop', orgId: ..., ... },
  { action: '/api/bookings', method: 'POST' },
)
```

With:
```ts
import { useStopBooking } from '~/features/bookings/hooks/use-stop-booking'

const { submit: stopBooking } = useStopBooking()
stopBooking({
  bookingId: booking.id,
  end: formatISOLocale(endTime),
  orgId: selectedOrgId,
  projectId: booking.projectReference?.id || '',
  start: booking.start?.dateTime || '',
  tags: booking.tags || [],
})
```

**Step 2: Migrate booking-current-entry-context.tsx**

Replace `updateCurrent` and `addFavorite` fetcher calls with:
```ts
import { useUpdateUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

const updateCurrent = useUpdateUserBookingCurrent()
const addFav = useAddFavoriteBooking()

// adjustStartToPrevious:
updateCurrent.submit({
  orgId: selectedOrgId,
  bookingId: item.id,
  body: { newStart: formatISOLocale(new Date(previousBooking.end.dateTime)) },
})

// addFavorite:
addFav.submit({
  orgId: selectedOrgId,
  body: {
    projectId: item.projectReference?.id || '',
    tags: item.tags || [],
  },
})
```

**Step 3: Run checks**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add frontend_rr7/app/features/bookings/components/booking-current.tsx frontend_rr7/app/features/bookings/components/booking-current-entry-context.tsx
git commit -m "Migrate remaining booking components to generated API hooks"
```

---

### Task 9: Remove old intent-dispatch routes

**Files:**
- Delete: `frontend_rr7/app/routes/api.bookings.ts`
- Delete: `frontend_rr7/app/routes/api.org-switch.ts`
- Modify: `frontend_rr7/app/routes.ts` — remove route entries

**Step 1: Check for remaining references to old routes**

Search for any remaining `action: '/api/bookings'` or `action: '/api/org-switch'` in the codebase. All should be gone after tasks 6-8.

```bash
grep -r "api/bookings\|api/org-switch" frontend_rr7/app/ --include="*.tsx" --include="*.ts" -l
```

Expected: only the route files themselves and `routes.ts`.

**Step 2: Check org-switch consumer**

Find where the org-switch fetcher is used and migrate it to a generated hook before deleting the route. Look in navigation or layout components.

**Step 3: Remove route entries from `routes.ts`**

Remove these lines:
```ts
route('org-switch', 'routes/api.org-switch.ts'),
route('bookings', 'routes/api.bookings.ts'),
```

**Step 4: Delete the route files**

```bash
rm frontend_rr7/app/routes/api.bookings.ts
rm frontend_rr7/app/routes/api.org-switch.ts
```

**Step 5: Run checks**

```bash
yarn check
```

Expected: PASS. No dangling imports.

**Step 6: Commit**

```bash
git add -u frontend_rr7/app/routes/
git commit -m "Remove intent-dispatch API routes replaced by proxy"
```

---

### Task 10: Add `.gitignore` and eslint ignore for generated hooks

**Files:**
- Modify: `frontend_rr7/.gitignore` (if generated hooks should not be committed)
- OR: Add eslint ignore for `lasius-hooks/` (if committed but not linted)
- Modify: `frontend_rr7/eslint.config.js`

**Step 1: Decide: commit generated hooks or gitignore them?**

Check the existing approach — `app/services/api/lasius/` (server client) is committed. Follow the same pattern for `lasius-hooks/`.

If committed: add eslint ignore for the directory (generated code may not pass lint):
```js
// In eslint.config.js ignores array:
{ ignores: ['app/services/api/lasius-hooks/**'] }
```

**Step 2: Run checks**

```bash
yarn check
```

**Step 3: Commit**

```bash
git add frontend_rr7/eslint.config.js
git commit -m "Add eslint ignore for generated hook files"
```

---

### Task 11: Manual verification

**Step 1: Start the full stack**

Ensure backend (port 9000), services, and frontend dev server are running.

**Step 2: Test booking operations**

- Start a booking → verify it starts (check WebSocket update)
- Stop a booking → verify it stops
- Delete a booking → verify it's removed from the list
- Adjust start/end times → verify updates
- Add to favorites → verify favorite is added
- Stop and start (switch bookings) → verify old stops, new starts

**Step 3: Test public endpoints**

- Config endpoint works without auth (useGetConfiguration with skipAuth)

**Step 4: Test error cases**

- Submit with missing fields → verify proxy returns 400
- Submit while logged out → verify redirect to login

**Step 5: Verify no hardcoded strings remain**

```bash
grep -r "intent.*delete\|intent.*update\|intent.*stop\|intent.*start\|intent.*addFavorite" frontend_rr7/app/ --include="*.tsx" --include="*.ts" -l
```

Expected: no results (all intents removed).
