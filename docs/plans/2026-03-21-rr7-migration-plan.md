# React Router 7 Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a new `frontend_rr7/` project with React Router 7, Vite, Tailwind/DaisyUI, i18n, Orval fetch client, and full multi-provider OAuth auth — matching the current Next.js frontend's auth capabilities and UI design.

**Architecture:** RR7 with SSR via loaders/actions, cookie-based sessions for auth (no Auth.js), Orval-generated fetch functions called in loaders, remix-i18next for i18n with cookie-based locale (no URL prefix). Reference project at `~/projects/km/frontend` provides the scaffold baseline.

**Tech Stack:** React Router 7, Vite 8, React 19, TypeScript, Tailwind CSS 4, DaisyUI 5, remix-i18next, Orval (fetch client), Zustand, Zod, tslog

**Design doc:** `docs/plans/2026-03-21-rr7-migration-design.md`

**Reference project:** `~/projects/km/frontend` (production RR7 app with similar stack)

**Key decisions:**
- Cookie-only locale detection (no `:lang` URL prefix) — matches existing Next.js app URL structure
- Same env var names as Next.js frontend (NEXTAUTH_SECRET, LASIUS_OAUTH_CLIENT_ID, etc.) — ensures compatibility
- Orval with `client: 'fetch'` — no SWR/Axios, data fetching exclusively in loaders
- Vite default port 5173 (proxied at :3000 via Caddy)

---

## Phase 1: Scaffold & Infrastructure (DONE)

### Task 1: Initialize project and copy scaffold from reference — DONE ✓

**Status:** Committed (`feat(rr7): initialize project scaffold`)

**What was done:**
- Created `frontend_rr7/` with package.json adapted from km/frontend
- Configured Vite 8 with Tailwind, RR7 plugin (patched for Vite 8 compat), React Compiler babel plugin
- react-router.config.ts with SSR + middleware enabled
- .env.template with same env var names as Next.js frontend
- Installed all dependencies including `@babel/core` peer dep

**Verified:** `yarn install` succeeds, `yarn check` passes

---

### Task 2: Entry points, root layout, and Tailwind setup — DONE ✓

**Status:** Committed

**What was done:**
- `entry.server.tsx` — streaming SSR with I18nextProvider, isbot detection, try-catch fallback for middleware context on non-route requests
- `entry.client.tsx` — client hydration with i18next-fetch-backend
- `root.tsx` — root layout with i18n middleware, locale cookie, ErrorBoundary (401/404/5xx), `useChangeLanguage`
- `tailwind.css` with DaisyUI plugin
- `routes.ts` with all route definitions

**Verified:** `yarn check` passes, dev server starts

---

### Task 3: Tooling — ESLint, Prettier, yarn check — DONE ✓

**Status:** Committed

**What was done:**
- ESLint config (flat config) adapted from km/frontend
- Prettier config
- `yarn check` script: eslint → prettier → react-router typegen → tsc

**Verified:** `yarn check` passes

---

### Task 4: i18n setup with remix-i18next — DONE ✓

**Status:** Committed

**What was done:**
- Copied locale JSON files from `frontend/public/locales/` to `frontend_rr7/app/locales/`
- `i18n-config.ts` — 5 languages (en/de/fr/it/es), 2 namespaces (common/integrations), resources imported from locale files
- `middleware/i18next.ts` — cookie-based + Accept-Language detection (no path-based)
- `lib/cookies/i18next-cookie.server.ts` — locale cookie
- `entry.server.tsx` wired with I18nextProvider
- `entry.client.tsx` wired with i18next-fetch-backend
- `routes/api.locales.$lang.$ns.ts` — API route serving locale JSON for client-side fetching

**Bug fixed:** "No value found for context" error — missing locale API route caused unmatched requests to crash in middleware context lookup. Fixed with API route + try-catch fallback in entry.server.tsx.

**Verified:** `yarn check` passes, no i18n errors in dev server logs

---

## Phase 2: Auth System (DONE)

### Task 5: Cookie session storage and auth helpers — DONE ✓

**Status:** Committed

**What was done:**
- `services/auth/types.ts` — AuthProvider, LasiusSessionData, TokenResponse, OAuthProvider types
- `services/auth/session.server.ts` — cookie session storage (`_lasius_session`), auto-refresh with 60s buffer, create/destroy helpers. Uses NEXTAUTH_SECRET.
- `services/auth/auth-helpers.server.ts` — `requireUser()`, `getOptionalUser()`, `authHeaders()`
- `lib/env.server.ts` — getServerEnvRequired/getServerEnv helpers

**Verified:** `yarn check` passes

---

### Task 6: OAuth provider configuration and registry — DONE ✓

**Status:** Committed

**What was done:**
- `services/auth/providers/index.ts` — provider registry, auto-detects enabled providers from env vars
- `services/auth/providers/keycloak.server.ts`
- `services/auth/providers/github.server.ts`
- `services/auth/providers/gitlab.server.ts`
- `services/auth/providers/internal.server.ts` — PKCE flow with backend OAuth2 endpoints

**Verified:** `yarn check` passes

---

### Task 7: Auth routes — login, logout, OAuth callback — DONE ✓

**Status:** Committed

**What was done:**
- `routes/login.tsx` — provider selection with DaisyUI card, demo mode support
- `routes/logout.tsx` — token revocation + session destruction
- `routes/oauth.$provider.login.tsx` — PKCE + state cookie → redirect to provider
- `routes/oauth.callback.tsx` — state validation → code exchange → session creation
- `routes/internal-oauth.login.tsx` — email/password form → backend PKCE flow

**Verified:** `yarn check` passes

---

### Task 8: Token refresh and session status endpoint — DONE ✓

**Status:** Committed

**What was done:**
- Token refresh logic in session.server.ts (auto-refresh in getSessionTokens)
- `routes/api.session-status.tsx` — polling endpoint for token watcher
- `components/token-watcher.tsx` — client-side session monitoring with DaisyUI warning modal

**Verified:** `yarn check` passes

---

## Phase 3: API Client & Protected Routes (DONE)

### Task 9: Orval fetch client configuration — DONE ✓

**Status:** Committed

**What was done:**
- `orval.config.mjs` — fetch client with custom mutator
- `services/api/lasius-fetch-instance.ts` — custom fetch mutator prepending LASIUS_API_URL
- 200+ auto-generated typed fetch functions in `services/api/lasius/`

**Verified:** `yarn check` passes, types generated

---

### Task 10: Smoke test — protected route with real API call — DONE ✓

**Status:** Committed

**What was done:**
- `routes/app-layout.tsx` — authenticated layout with `requireUser` guard, navbar, logout button
- `routes/dashboard.tsx` — calls `getUserProfile` via Orval fetch with `authHeaders`
- Routes registered without `:lang` prefix (cookie-only locale)

**Verified:** `yarn check` passes

---

### Task 11: Logger and error boundary — DONE ✓

**Status:** Committed

**What was done:**
- `lib/logger.ts` — edge-safe tslog logger (server) with console fallback (client/edge)
- ErrorBoundary in root.tsx — 401/404/5xx handling with DaisyUI cards

**Verified:** `yarn check` passes

---

## Phase 4: Dev Infrastructure (DONE)

### Task 12: Dev tooling updates — DONE ✓

**Status:** Uncommitted changes

**What was done:**
- `dev.sh` — updated to run `frontend_rr7` instead of `frontend`
- `services/Caddyfile.dev` — updated proxy from port 3001 to 5173
- `vite.config.ts` — removed explicit port (uses Vite default 5173)
- `.env.template` — uses same env var names as Next.js frontend

**Verified:** Dev server starts on :5173, proxy works at :3000, `yarn check` passes

---

## Phase 5: UI Migration — TODO

### Task 13: Login page — match existing design 1:1

**Status:** TODO

**Goal:** The current RR7 login page is a placeholder with DaisyUI cards. It needs to match the existing Next.js login page design exactly, adjusted for RR7 patterns.

**Steps:**
1. Study the existing login page at `frontend/src/pages/login.tsx` and its components
2. Study the internal login page at `frontend/src/pages/internal_oauth/login.tsx`
3. Identify shared components (layout wrapper, logo, footer, etc.)
4. Recreate the exact same visual design in RR7 using the existing Tailwind/DaisyUI classes
5. Ensure all functionality works: provider buttons, demo mode credentials display, returnTo param
6. Verify with `yarn check`

**Files to reference:**
- `frontend/src/pages/login.tsx` — existing login page
- `frontend/src/pages/internal_oauth/login.tsx` — existing internal login
- `frontend/src/components/` — shared components used in login

**Files to modify:**
- `frontend_rr7/app/routes/login.tsx`
- `frontend_rr7/app/routes/internal-oauth.login.tsx`
- May need to create shared layout/component files

---

### Task 14: Smoke test the full auth flow

**Status:** TODO

**Goal:** Manual end-to-end verification of the complete auth flow.

**Test plan:**
1. Visit `http://localhost:3000/` → should redirect to `/login` (unauthenticated)
2. Login with `demo1@lasius.ch` / `demo` via internal login form
3. Should redirect to dashboard with real user data from backend API
4. Verify token watcher polling works (check network tab for `/api/session-status`)
5. Visit `/logout` → should clear session and redirect to `/login`
6. Test OAuth provider flow (if keycloak is running)

---

### Task 15: Dashboard page — match existing design

**Status:** TODO

**Goal:** Port the existing dashboard layout and components from the Next.js frontend.

---

### Task 16: Navigation and app shell

**Status:** TODO

**Goal:** Port the sidebar navigation, header, user menu from the existing Next.js frontend.

---

## Verification Checklist

- [x] `yarn check` passes (typecheck + lint + format)
- [ ] `yarn build` produces working production build
- [x] `yarn dev` starts dev server
- [ ] Login with Keycloak provider works
- [ ] Login with internal provider works (demo1@lasius.ch / demo)
- [ ] Token refresh works (session survives past initial expiry)
- [ ] Logout revokes tokens and clears session
- [x] Protected route redirects to login when unauthenticated (code in place, needs manual test)
- [ ] Dashboard loads real data from backend API via Orval fetch
- [x] i18n detects locale and renders translated strings (middleware working)
- [x] Error boundary catches and displays errors
- [ ] Token watcher shows warning before session expiry
- [ ] Login page matches existing design 1:1
