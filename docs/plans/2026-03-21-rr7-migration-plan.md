# React Router 7 Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a new `frontend_rr7/` project with React Router 7, Vite, Tailwind/DaisyUI, i18n, Orval fetch client, and full multi-provider OAuth auth — matching the current Next.js frontend's auth capabilities.

**Architecture:** RR7 with SSR via loaders/actions, cookie-based sessions for auth (no Auth.js), Orval-generated fetch functions called in loaders, remix-i18next for i18n. Reference project at `~/projects/km/frontend` provides the scaffold baseline.

**Tech Stack:** React Router 7, Vite 8, React 19, TypeScript, Tailwind CSS 4, DaisyUI 5, remix-i18next, Orval (fetch client), Zustand, Zod, tslog

**Design doc:** `docs/plans/2026-03-21-rr7-migration-design.md`

**Reference project:** `~/projects/km/frontend` (production RR7 app with similar stack)

---

## Task 1: Initialize project and copy scaffold from reference

**Files:**
- Create: `frontend_rr7/package.json`
- Create: `frontend_rr7/vite.config.ts`
- Create: `frontend_rr7/react-router.config.ts`
- Create: `frontend_rr7/tsconfig.json`
- Create: `frontend_rr7/.env.template`

**Step 1: Create directory and initialize package.json**

Copy `~/projects/km/frontend/package.json` to `frontend_rr7/package.json`. Then adapt:
- Change `name` to `"lasius-frontend"`
- Remove km-specific deps: `remix-auth`, `remix-auth-form`, payload-related packages, `@conform-to/*` (add Conform later when needed)
- Keep: `react-router`, `@react-router/node`, `@react-router/serve`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `daisyui`, `i18next`, `react-i18next`, `remix-i18next`, `zustand`, `zod`, `tslog`, `date-fns`, `date-fns-tz`, `clsx`, `tailwind-merge`, `class-variance-authority`, `isbot`, `cookie`
- Add: `orval` (devDep), `react-hook-form`, `@hookform/resolvers` (existing form lib)
- Keep all devDeps: `@types/react`, `@types/node`, `typescript`, `vite`, `eslint`, `prettier`, `@epic-web/config`
- Keep scripts: `dev`, `build`, `check`, `typecheck`, `start`, `lint:fix`, `prettier`

**Step 2: Copy and adapt config files**

Copy from `~/projects/km/frontend/`:
- `vite.config.ts` → `frontend_rr7/vite.config.ts` — remove km-specific plugins (ViteImageOptimizer, svgr) if not needed yet, keep RR7 + Tailwind plugins
- `react-router.config.ts` → `frontend_rr7/react-router.config.ts` — keep as-is (SSR enabled, middleware enabled)
- `tsconfig.json` → `frontend_rr7/tsconfig.json` — keep `~/` path alias, adjust excludes

**Step 3: Create .env.template**

```bash
# App
NODE_ENV=development
ORIGIN=http://localhost:3001
BACKEND_URL=http://localhost:9000

# Auth
AUTH_SECRET=change-me-to-random-string
LASIUS_AUTH_PROVIDERS=keycloak,internal

# Keycloak
KEYCLOAK_ISSUER=http://localhost:8080/realms/lasius
KEYCLOAK_CLIENT_ID=lasius
KEYCLOAK_CLIENT_SECRET=

# GitHub (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# GitLab (optional)
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
GITLAB_URL=https://gitlab.com
```

**Step 4: Install dependencies**

Run: `cd frontend_rr7 && yarn install`

**Step 5: Commit**

```bash
git add frontend_rr7/package.json frontend_rr7/vite.config.ts frontend_rr7/react-router.config.ts frontend_rr7/tsconfig.json frontend_rr7/.env.template frontend_rr7/yarn.lock
git commit -m "feat(rr7): initialize project scaffold from km/frontend reference"
```

---

## Task 2: Entry points, root layout, and Tailwind setup

**Files:**
- Create: `frontend_rr7/app/root.tsx`
- Create: `frontend_rr7/app/entry.server.tsx`
- Create: `frontend_rr7/app/entry.client.tsx`
- Create: `frontend_rr7/app/tailwind.css`
- Create: `frontend_rr7/app/routes.ts`

**Step 1: Copy entry points from km/frontend**

Copy `~/projects/km/frontend/app/entry.server.tsx` → `frontend_rr7/app/entry.server.tsx`
- Keep streaming SSR with `renderToPipeableStream`
- Keep isbot detection
- Strip km-specific i18n provider wrapping (add back in Task 4)
- Strip km-specific REST client provider

Copy `~/projects/km/frontend/app/entry.client.tsx` → `frontend_rr7/app/entry.client.tsx`
- Keep `hydrateRoot` with StrictMode
- Strip km-specific i18n init (add back in Task 4)
- Keep error listeners

**Step 2: Create minimal root.tsx**

Copy structure from `~/projects/km/frontend/app/root.tsx`, simplify to:
- Basic HTML shell with `<Links>`, `<Meta>`, `<Scripts>`, `<ScrollRestoration>`
- No loader yet (add in Task 5 for auth)
- No i18n yet (add in Task 4)
- Import `tailwind.css`
- Export `Layout` and default component with `<Outlet />`

**Step 3: Create tailwind.css**

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
  logs: false;
}
```

**Step 4: Copy routes.ts from km/frontend**

Copy `~/projects/km/frontend/app/routes.ts` → `frontend_rr7/app/routes.ts`
- Strip all km-specific routes (products, cart, account, checkout, etc.)
- Keep the structure: `route()`, `layout()`, `prefix()`, `index()` imports
- Add placeholder routes: index, login, logout, oauth callback
- Keep `:lang` prefix pattern for i18n routing

Minimal routes.ts:
```typescript
import { type RouteConfig, index, layout, prefix, route } from '@react-router/dev/routes'

export default [
  // Health check
  index('routes/home.tsx'),

  // Auth routes (no lang prefix — OAuth redirects are language-independent)
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('internal-oauth/login', 'routes/internal-oauth.login.tsx'),
  route('oauth/:provider/login', 'routes/oauth.$provider.login.tsx'),
  route('oauth/callback', 'routes/oauth.callback.tsx'),

  // Language-prefixed app routes (added in later tasks)
  ...prefix(':lang', [
    // layout('routes/app-layout.tsx', [
    //   index('routes/dashboard.tsx'),
    // ]),
  ]),
] satisfies RouteConfig
```

**Step 5: Create placeholder home route**

Create `frontend_rr7/app/routes/home.tsx`:
```typescript
export default function Home() {
  return <div>Lasius RR7 — scaffold working</div>
}
```

**Step 6: Verify it builds**

Run: `cd frontend_rr7 && yarn typecheck`
Expected: PASS (types generate, no errors)

Run: `cd frontend_rr7 && yarn build`
Expected: PASS (Vite builds successfully)

**Step 7: Commit**

```bash
git add frontend_rr7/app/
git commit -m "feat(rr7): add entry points, root layout, Tailwind, and route scaffold"
```

---

## Task 3: Tooling — ESLint, Prettier, yarn check

**Files:**
- Create: `frontend_rr7/eslint.config.js` (or `.eslintrc.cjs`)
- Create: `frontend_rr7/.prettierrc`
- Modify: `frontend_rr7/package.json` (scripts)

**Step 1: Copy lint/format config from km/frontend**

Copy ESLint and Prettier configs from `~/projects/km/frontend/`. Adapt:
- Keep TypeScript + React rules
- Add AGPL header rule if eslint plugin available, otherwise document as manual check

**Step 2: Verify yarn check passes**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS (typecheck + lint + format all clean)

**Step 3: Commit**

```bash
git add frontend_rr7/eslint.config.js frontend_rr7/.prettierrc
git commit -m "feat(rr7): add ESLint and Prettier configuration"
```

---

## Task 4: i18n setup with remix-i18next

**Files:**
- Create: `frontend_rr7/app/i18n-config.ts`
- Create: `frontend_rr7/app/middleware/i18next.ts`
- Create: `frontend_rr7/app/lib/i18n/i18n.server.ts`
- Create: `frontend_rr7/app/lib/i18n/i18n.client.ts`
- Copy: `frontend/public/locales/` → `frontend_rr7/app/locales/`
- Modify: `frontend_rr7/app/root.tsx` (add i18n)
- Modify: `frontend_rr7/app/entry.server.tsx` (add i18n provider)
- Modify: `frontend_rr7/app/entry.client.tsx` (add i18n init)

**Step 1: Copy locale files**

```bash
cp -r frontend/public/locales/* frontend_rr7/app/locales/
```

**Step 2: Create i18n-config.ts**

Adapt from `~/projects/km/frontend/app/i18n-config.ts`:
- Set `supportedLangs` from current `next-i18next.config.js` (check for de, en, fr, etc.)
- Set `defaultLocale` to match current config
- Set `namespaces` to match current translation file structure

**Step 3: Create i18n middleware**

Copy `~/projects/km/frontend/app/middleware/i18next.ts` → adapt for Lasius locale config.

**Step 4: Create server/client i18n helpers**

Follow km/frontend pattern:
- Server: create i18n instance per request with detected locale
- Client: init i18next with browser language detection, hydrate from server

**Step 5: Wire i18n into entry points and root**

- `entry.server.tsx`: wrap `<RemixServer>` with `<I18nextProvider>`
- `entry.client.tsx`: init i18next before `hydrateRoot`
- `root.tsx`: add `handle.i18n` export, set `lang` and `dir` on `<html>`, add i18n middleware

**Step 6: Add a test translation to verify**

In `routes/home.tsx`, add `useTranslation()` hook and render a translated string.

**Step 7: Verify**

Run: `cd frontend_rr7 && yarn build`
Expected: PASS

**Step 8: Commit**

```bash
git add frontend_rr7/app/locales/ frontend_rr7/app/i18n-config.ts frontend_rr7/app/middleware/ frontend_rr7/app/lib/i18n/
git commit -m "feat(rr7): add remix-i18next with locale files ported from Next.js frontend"
```

---

## Task 5: Cookie session storage and auth helpers

**Files:**
- Create: `frontend_rr7/app/services/auth/session.server.ts`
- Create: `frontend_rr7/app/services/auth/auth-helpers.server.ts`
- Create: `frontend_rr7/app/services/auth/types.ts`
- Create: `frontend_rr7/app/lib/env.server.ts`

**Step 1: Create auth types**

```typescript
// app/services/auth/types.ts
export type AuthProvider = 'keycloak' | 'github' | 'gitlab' | 'internal'

export interface LasiusSessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number        // ms timestamp (Date.now())
  userId: string
  email: string
  tokenIssuer: AuthProvider
}

export interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
  scope?: string
}

export interface OAuthProviderConfig {
  provider: AuthProvider
  authorizationUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  scope: string
  revokeUrl?: string
}
```

**Step 2: Create env helper**

Adapt from km/frontend pattern — `getServerEnvRequired()` and `getServerEnv()` helpers:
```typescript
// app/lib/env.server.ts
export function getServerEnvRequired(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export function getServerEnv(key: string): string | undefined {
  return process.env[key]
}
```

**Step 3: Create cookie session storage**

Adapt from km/frontend `customer-session.server.ts`:
```typescript
// app/services/auth/session.server.ts
import { createCookieSessionStorage } from 'react-router'

const sessionStorage = createCookieSessionStorage<{ user: LasiusSessionData }>({
  cookie: {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,  // 7 days
    name: '_lasius_session',
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.AUTH_SECRET!],
    secure: process.env.NODE_ENV === 'production',
  },
})
```

Implement:
- `getSessionTokens(request)` — reads session, auto-refreshes if expired (60s buffer)
- `setSessionTokens(session, data)` — writes token data to session
- `commitSession(session)` — returns Set-Cookie header
- `destroySession(request)` — clears session cookie

**Step 4: Create auth guard helpers**

```typescript
// app/services/auth/auth-helpers.server.ts
export async function requireUser(request: Request): Promise<LasiusSessionData> {
  const tokens = await getSessionTokens(request)
  if (!tokens) {
    const url = new URL(request.url)
    throw redirect(`/login?returnTo=${encodeURIComponent(url.pathname)}`)
  }
  return tokens
}

export async function getOptionalUser(request: Request): Promise<LasiusSessionData | null> {
  return await getSessionTokens(request)
}

export function authHeaders(session: LasiusSessionData): Record<string, string> {
  return {
    'Authorization': `Bearer ${session.accessToken}`,
    'X-Token-Issuer': session.tokenIssuer,
  }
}
```

**Step 5: Commit**

```bash
git add frontend_rr7/app/services/auth/ frontend_rr7/app/lib/env.server.ts
git commit -m "feat(rr7): add cookie session storage and auth guard helpers"
```

---

## Task 6: OAuth provider configuration and registry

**Files:**
- Create: `frontend_rr7/app/services/auth/providers/index.ts`
- Create: `frontend_rr7/app/services/auth/providers/keycloak.server.ts`
- Create: `frontend_rr7/app/services/auth/providers/github.server.ts`
- Create: `frontend_rr7/app/services/auth/providers/gitlab.server.ts`
- Create: `frontend_rr7/app/services/auth/providers/internal.server.ts`

**Step 1: Create provider interface and registry**

```typescript
// app/services/auth/providers/index.ts
// Reads LASIUS_AUTH_PROVIDERS env var, returns configured provider instances
// Each provider implements: getAuthorizationUrl(), exchangeCode(), refreshToken(), revokeToken()
```

**Step 2: Implement Keycloak provider**

Reference: current `[...nextauth].ts` Keycloak config.
- Authorization URL: `${KEYCLOAK_ISSUER}/protocol/openid-connect/auth`
- Token URL: `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`
- Revoke URL: `${KEYCLOAK_ISSUER}/protocol/openid-connect/revoke`
- Scope: `openid profile email`
- Uses standard Authorization Code flow

**Step 3: Implement GitHub provider**

Reference: current `[...nextauth].ts` GitHub config.
- Authorization URL: `https://github.com/login/oauth/authorize`
- Token URL: `https://github.com/login/oauth/access_token`
- Revoke URL: `https://api.github.com/applications/${clientId}/token` (DELETE)
- Scope: `read:user user:email`

**Step 4: Implement GitLab provider**

Reference: current `[...nextauth].ts` GitLab config.
- Authorization URL: `${GITLAB_URL}/oauth/authorize`
- Token URL: `${GITLAB_URL}/oauth/token`
- Revoke URL: `${GITLAB_URL}/oauth/revoke`
- Scope: `read_user`

**Step 5: Implement Internal provider**

Reference: current `internal_oauth/login.tsx` — this uses the backend's own OAuth2 endpoints with PKCE.
- Authorization/login: POST to `${BACKEND_URL}/oauth2/login` with email + password + PKCE challenge
- Token exchange: POST to `${BACKEND_URL}/oauth2/access_token` with code + PKCE verifier
- Profile: GET `${BACKEND_URL}/oauth2/profile` with access token
- Revoke: POST to `${BACKEND_URL}/oauth2/logout`
- **Different from external providers** — credentials submitted directly, no redirect

**Step 6: Commit**

```bash
git add frontend_rr7/app/services/auth/providers/
git commit -m "feat(rr7): add OAuth provider implementations (keycloak, github, gitlab, internal)"
```

---

## Task 7: Auth routes — login, logout, OAuth callback

**Files:**
- Create: `frontend_rr7/app/routes/login.tsx`
- Create: `frontend_rr7/app/routes/logout.tsx`
- Create: `frontend_rr7/app/routes/oauth.$provider.login.tsx`
- Create: `frontend_rr7/app/routes/oauth.callback.tsx`
- Create: `frontend_rr7/app/routes/internal-oauth.login.tsx`

**Step 1: Create login page**

Port from `frontend/src/pages/login.tsx`:
- Loader: read `LASIUS_AUTH_PROVIDERS` env, return list of enabled providers. If user already authenticated, redirect to dashboard.
- Component: render provider selection buttons (Keycloak, GitHub, GitLab links → `/oauth/:provider/login`; Internal → `/internal-oauth/login`)
- Style with DaisyUI card + button components
- Support `?returnTo=` query param (pass through to OAuth flow)

**Step 2: Create OAuth initiation route**

```typescript
// app/routes/oauth.$provider.login.tsx
// Loader: generates state + PKCE verifier, stores in a short-lived cookie,
// redirects to provider's authorization URL with callback URL
```

**Step 3: Create OAuth callback route**

```typescript
// app/routes/oauth.callback.tsx
// Loader: reads code + state from query params, validates state against cookie,
// exchanges code for tokens via provider, fetches user profile,
// creates session with LasiusSessionData, redirects to returnTo or /
```

**Step 4: Create internal login route**

Port from `frontend/src/pages/internal_oauth/login.tsx`:
- Component: email/password form (use React Hook Form + Zod for now)
- Action: validates credentials, calls backend `/oauth2/login` with PKCE,
  exchanges code for token, creates session, redirects

**Step 5: Create logout route**

```typescript
// app/routes/logout.tsx
// Action: reads session, calls provider-specific revoke endpoint,
// destroys session cookie, redirects to /login
```

**Step 6: Update routes.ts**

Ensure all auth routes are registered (should already be from Task 2).

**Step 7: Verify build**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 8: Commit**

```bash
git add frontend_rr7/app/routes/login.tsx frontend_rr7/app/routes/logout.tsx frontend_rr7/app/routes/oauth.* frontend_rr7/app/routes/internal-oauth.*
git commit -m "feat(rr7): add auth routes (login, logout, OAuth callback, internal login)"
```

---

## Task 8: Token refresh and session status endpoint

**Files:**
- Modify: `frontend_rr7/app/services/auth/session.server.ts` (add refresh logic)
- Create: `frontend_rr7/app/routes/api.session-status.tsx`
- Create: `frontend_rr7/app/components/token-watcher.tsx`

**Step 1: Implement token refresh in session.server.ts**

In `getSessionTokens()`:
- Check if `expiresAt < Date.now() + 60_000`
- If expired, call provider's `refreshToken()` using the stored `tokenIssuer`
- If refresh succeeds, return new tokens + signal caller to commit session
- If refresh fails, return `null` (forces re-login)

Return type should include a `headers` field when session was refreshed, so loaders can include `Set-Cookie` in response.

**Step 2: Create session status API route**

```typescript
// app/routes/api.session-status.tsx
// Loader: returns { authenticated: boolean, expiresAt: number | null }
// Used by token watcher component for polling
```

**Step 3: Port token watcher component**

Adapt from `frontend/src/components/features/system/tokenWatcher.tsx`:
- Polls `/api/session-status` every 30s (reduce from current 1s — loader-based refresh handles most cases)
- Shows DaisyUI modal warning at 2 minutes before expiry
- Refresh button calls `/api/session-refresh` (or navigates to trigger loader revalidation)

**Step 4: Add token watcher to root.tsx**

Import and render `<TokenWatcher />` in root layout (client-only).

**Step 5: Commit**

```bash
git add frontend_rr7/app/services/auth/session.server.ts frontend_rr7/app/routes/api.session-status.tsx frontend_rr7/app/components/token-watcher.tsx frontend_rr7/app/root.tsx
git commit -m "feat(rr7): add token refresh, session status endpoint, and token watcher"
```

---

## Task 9: Orval fetch client configuration

**Files:**
- Create: `frontend_rr7/orval.config.mjs`
- Create: `frontend_rr7/app/services/api/lasius-fetch-instance.ts`
- Copy: `frontend/swagger.json` → `frontend_rr7/swagger.json`
- Modify: `frontend_rr7/package.json` (add `orval` script)

**Step 1: Copy swagger.json**

```bash
cp frontend/swagger.json frontend_rr7/swagger.json
```

**Step 2: Create Orval config**

```javascript
// frontend_rr7/orval.config.mjs
export default {
  lasius: {
    input: { target: './swagger.json' },
    output: {
      target: './app/services/api/lasius',
      client: 'fetch',
      mode: 'tags-split',
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

**Step 3: Create custom fetch instance**

```typescript
// app/services/api/lasius-fetch-instance.ts
// Custom fetcher that Orval-generated functions call.
// Signature must match Orval's fetch mutator contract.
// Prepends BACKEND_URL, passes through headers (auth injected by caller in loader).
```

Key: the generated functions accept an options object with `headers`. Loaders call them like:
```typescript
const result = await getProjects(orgId, { headers: authHeaders(session) })
```

**Step 4: Add orval script and generate**

Add to package.json scripts: `"orval": "orval"`

Run: `cd frontend_rr7 && yarn orval`
Expected: generates typed fetch functions in `app/services/api/lasius/`

**Step 5: Verify types**

Run: `cd frontend_rr7 && yarn typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend_rr7/orval.config.mjs frontend_rr7/swagger.json frontend_rr7/app/services/api/ frontend_rr7/package.json
git commit -m "feat(rr7): add Orval fetch client configuration and generate API types"
```

---

## Task 10: Smoke test — protected route with real API call

**Files:**
- Create: `frontend_rr7/app/routes/app-layout.tsx`
- Create: `frontend_rr7/app/routes/dashboard.tsx`
- Modify: `frontend_rr7/app/routes.ts` (enable lang-prefixed routes)

**Step 1: Create app layout with auth guard**

```typescript
// app/routes/app-layout.tsx
// Loader: requireUser(request) — redirects to /login if not authenticated
// Component: basic shell with <Outlet />, user info from loader
export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await requireUser(request)
  return data({ user: { email: session.email, userId: session.userId } })
}
```

**Step 2: Create dashboard route**

```typescript
// app/routes/dashboard.tsx
// Loader: calls a real Orval-generated function (e.g., getCurrentUser or getOrganisations)
// Component: renders the response data
```

**Step 3: Enable routes in routes.ts**

Uncomment the `:lang` prefix block, add:
```typescript
...prefix(':lang', [
  layout('routes/app-layout.tsx', [
    index('routes/dashboard.tsx'),
  ]),
]),
```

**Step 4: Manual verification**

Start dev server: `cd frontend_rr7 && yarn dev`

Test flow:
1. Visit `http://localhost:3001/` → should see home page
2. Visit `http://localhost:3001/en/` → should redirect to `/login` (not authenticated)
3. Login with `demo1@lasius.ch` / `demo` via internal login
4. Should redirect to `/en/` dashboard with real data from backend
5. Visit `/logout` → should clear session and redirect to `/login`

**Step 5: Commit**

```bash
git add frontend_rr7/app/routes/app-layout.tsx frontend_rr7/app/routes/dashboard.tsx frontend_rr7/app/routes.ts
git commit -m "feat(rr7): add protected dashboard route with real API call as smoke test"
```

---

## Task 11: Logger and error boundary

**Files:**
- Create: `frontend_rr7/app/lib/logger.ts`
- Create: `frontend_rr7/app/services/error-boundary/error-boundary.tsx`
- Modify: `frontend_rr7/app/root.tsx` (add ErrorBoundary export)

**Step 1: Create tslog logger**

Port from km/frontend or existing Lasius frontend — tslog instance with structured output. Never `console.*` in production.

**Step 2: Create error boundary**

RR7 `ErrorBoundary` export in root.tsx. Handle:
- 401 → redirect to login
- 404 → not found page
- 500 → generic error page with error details in dev

Reference: km/frontend error boundary pattern.

**Step 3: Commit**

```bash
git add frontend_rr7/app/lib/logger.ts frontend_rr7/app/services/error-boundary/
git commit -m "feat(rr7): add tslog logger and root error boundary"
```

---

## Verification Checklist (after all tasks)

- [ ] `yarn check` passes (typecheck + lint + format)
- [ ] `yarn build` produces working production build
- [ ] `yarn dev` starts dev server
- [ ] Login with Keycloak provider works
- [ ] Login with internal provider works (demo1@lasius.ch / demo)
- [ ] Token refresh works (session survives past initial expiry)
- [ ] Logout revokes tokens and clears session
- [ ] Protected route redirects to login when unauthenticated
- [ ] Dashboard loads real data from backend API via Orval fetch
- [ ] i18n detects locale and renders translated strings
- [ ] Error boundary catches and displays errors
- [ ] Token watcher shows warning before session expiry
