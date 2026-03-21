# React Router 7 Migration — Design Document

**Date:** 2026-03-21
**Branch:** `feature/migrate-react-router-7`
**Status:** Approved

## Motivation

Next.js is being replaced with React Router 7 because:

1. **App Router migration ≈ same effort as RR7 migration** — rewriting `getServerSideProps` to either RSC or RR7 loaders is comparable work
2. **Auth.js is incompatible with Next.js 16** — the auth middleware pattern breaks, and Auth.js solutions in Next.js are hacks that don't fit our multi-provider Keycloak setup
3. **Simpler architecture** — RR7 gives direct control over routing, data loading, and sessions without framework magic

## Architecture

### Stack

| Layer | Current (Next.js 15) | Target (React Router 7) |
|-------|---------------------|------------------------|
| Framework | Next.js 15 Pages Router | React Router 7 + Vite |
| SSR | `getServerSideProps` | Loaders |
| Mutations | API calls from components | Actions |
| Auth | Auth.js v5 / next-auth | Direct OAuth + cookie sessions |
| API client | Orval → SWR hooks + Axios | Orval → `fetch` functions |
| i18n | next-i18next | remix-i18next |
| State | Zustand + SWR | Zustand + `useLoaderData()` |
| Styling | Tailwind 4 + DaisyUI 5 | Tailwind 4 + DaisyUI 5 (unchanged) |
| Forms | React Hook Form + Zod | RHF + Zod (existing), Conform + Zod (new forms, gradual) |
| Build | Next.js compiler | Vite 8 |

### Directory Structure

```
frontend_rr7/
├── app/
│   ├── routes/              # RR7 route modules (loaders, actions, components)
│   ├── routes.ts            # Route config (copied from km/frontend, adapted)
│   ├── components/          # Shared React components
│   ├── features/            # Feature-specific components
│   ├── services/
│   │   ├── auth/            # OAuth + session management (.server.ts)
│   │   └── api/             # Orval-generated fetch client + custom instance
│   ├── stores/              # Zustand stores
│   ├── lib/                 # Utilities (logger, cookies, i18n, error handling)
│   ├── locales/             # i18n JSON files (ported from frontend/)
│   ├── middleware/          # RR7 middleware (i18n)
│   ├── i18n-config.ts       # i18n configuration
│   ├── root.tsx             # Root layout
│   ├── entry.server.tsx     # SSR entry
│   └── entry.client.tsx     # Client hydration entry
├── vite.config.ts
├── react-router.config.ts
├── orval.config.mjs
├── tsconfig.json
├── package.json
└── .env.template
```

### Data Flow

```
Request → RR7 Middleware (i18n) → Route Loader
  → requireUser(request) → getSessionTokens() [auto-refresh]
  → orvalFetchFunction(params, { headers: { Authorization, X-Token-Issuer } })
  → return data()

Component: useLoaderData() → render

Form Submit → Route Action
  → requireUser(request)
  → orvalMutationFunction(body, { headers })
  → redirect() or return data()

RR7 auto-revalidates loaders after action completes
```

## Auth Design

### Overview

Direct OAuth implementation using `createCookieSessionStorage` — no Auth.js, no next-auth. Multi-provider support via environment variables.

### Session Cookie

```typescript
// Cookie: _lasius_session
interface LasiusSessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number        // ms timestamp
  userId: string
  email: string
  tokenIssuer: string      // "keycloak" | "github" | "gitlab" | "internal"
}
```

### Providers

4 OAuth providers, selectable via env var:

```
LASIUS_AUTH_PROVIDERS=keycloak,github,gitlab,internal
```

| Provider | Flow | Token Exchange |
|----------|------|---------------|
| Keycloak | Authorization Code | Keycloak token endpoint |
| GitHub | Authorization Code | GitHub OAuth token endpoint |
| GitLab | Authorization Code | GitLab OAuth token endpoint |
| Internal | PKCE via backend `/oauth2/login` | Backend `/oauth2/access_token` |

Each provider has its own env block:

```
# Keycloak
KEYCLOAK_ISSUER=http://localhost:8080/realms/lasius
KEYCLOAK_CLIENT_ID=lasius
KEYCLOAK_CLIENT_SECRET=...

# GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# GitLab
GITLAB_CLIENT_ID=...
GITLAB_CLIENT_SECRET=...
GITLAB_URL=https://gitlab.com

# Internal (uses backend OAuth2 endpoints)
LASIUS_BACKEND_URL=http://localhost:9000
```

### Auth Routes

| Route | Purpose |
|-------|---------|
| `/login` | Provider selection page (renders buttons for enabled providers) |
| `/internal-oauth/login` | Internal credential form (username/password) |
| `/oauth/:provider/login` | Initiates OAuth redirect to external provider |
| `/oauth/callback` | Handles OAuth callback, exchanges code, sets session |
| `/logout` | Revokes tokens (per-provider), destroys session |

### Auth Helpers

```typescript
// In loaders — require auth (redirect to /login if missing)
const session = await requireUser(request)

// In loaders — optional auth
const session = await getOptionalUser(request)

// Token refresh — transparent, called by getSessionTokens()
// Auto-refreshes if expiresAt < Date.now() + 60_000
```

### Token Watcher

Client-side component (ported from existing `tokenWatcher.tsx`):
- Polls `/api/session-status` endpoint (lightweight loader)
- Shows warning modal at 2 minutes before expiry
- Can trigger refresh via `session.update()`

### Backend Integration

Unchanged from current setup:
- `Authorization: Bearer <JWT>` header on all API calls
- `X-Token-Issuer` header for multi-issuer support
- Backend validates JWT signature per issuer

## API Client — Orval with `fetch`

### Config Change

```javascript
// orval.config.mjs
export default {
  lasius: {
    input: { target: './swagger.json' },
    output: {
      target: './app/services/api/lasius',
      client: 'fetch',          // was: 'swr'
      mode: 'tags-split',
      // custom fetch instance for auth token injection
      override: {
        mutator: {
          path: './app/services/api/lasius-fetch-instance.ts',
          name: 'lasiusFetch',
        },
      },
    },
  },
}
```

### Custom Fetch Instance

```typescript
// app/services/api/lasius-fetch-instance.ts
// Injects Authorization + X-Token-Issuer headers
// Base URL from env
// Called in loaders/actions where session tokens are available
```

### Usage Pattern

```typescript
// In a loader
export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await requireUser(request)
  const projects = await getProjects(orgId, {
    headers: authHeaders(session),
  })
  return data({ projects })
}

// In a component — no fetching, just data
export default function ProjectsPage() {
  const { projects } = useLoaderData<typeof loader>()
  return <ProjectList projects={projects} />
}
```

## i18n

- **Library:** remix-i18next (replaces next-i18next)
- **Locale routing:** `:lang` prefix in routes (from km/frontend pattern)
- **Detection:** URL path → Accept-Language → fallback
- **Locale files:** Ported from `frontend/public/locales/`
- **Namespaces:** Same as current (common, etc.)
- **Middleware:** i18next RR7 middleware for server-side detection

## Forms — Hybrid Approach

- **Existing forms:** Keep React Hook Form + Zod (port as-is)
- **New forms:** Use Conform + Zod (RR7-native, progressive enhancement)
- **Migration:** Gradual — convert forms to Conform when touching them

## Reference Project

`~/projects/km/frontend` — production RR7 app with similar stack. Copy and adapt:
- `routes.ts` (route configuration DSL)
- `root.tsx`, `entry.server.tsx`, `entry.client.tsx`
- Vite + RR7 config
- Tailwind/DaisyUI CSS setup
- remix-i18next setup
- Session management patterns
- `yarn check` / build scripts

## Out of Scope (Phase 1)

- Page migration beyond auth flows
- E2E tests
- Production deployment / Dockerfile
- Conform migration of existing forms
- React Compiler
