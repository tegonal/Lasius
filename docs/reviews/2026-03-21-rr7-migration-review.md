# Code Review: React Router 7 Migration

**Branch:** feature/migrate-react-router-7
**Reviewer:** Code Review Agent
**Date:** 2026-03-21

## Summary

The migration is well-structured with strong security fundamentals: proper cookie settings, PKCE OAuth flow, state cookie CSRF protection, open redirect prevention, and correct session management patterns. Code quality is high overall with consistent AGPL headers, proper use of `logger` over `console.*`, good test coverage for utilities, and proper React Router 7 patterns.

---

## Critical Issues

### 1. Access token exposed to client via loader data (SECURITY)

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/app-layout.tsx` (line 68)

The app-layout loader returns `accessToken` and `tokenIssuer` directly in loader data, which React Router serializes to the client as JSON in the HTML. This exposes the raw access token in the page source, making it available to any XSS vector or browser extension.

```typescript
return data(
    {
        accessToken: auth.session.accessToken,   // <-- exposed to client
        tokenIssuer: auth.session.tokenIssuer,   // <-- exposed to client
        user: profile.data,
        websocketUrl: process.env.LASIUS_API_WEBSOCKET_URL || '',
    },
    { headers: mergeAuthHeaders(auth) },
)
```

**Recommendation:** If the client needs the token (e.g., for WebSocket auth), consider a dedicated server-side endpoint that provides a short-lived WebSocket ticket, or pass only the WebSocket URL and let the server proxy handle authentication. If the token must be client-accessible, document the security trade-off explicitly.

---

## Important Issues

### 2. Duplicate user profile fetch (PERFORMANCE)

**Files:**
- `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/app-layout.tsx` (line 63)
- `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/dashboard.tsx` (line 36)

Both the layout loader and the dashboard loader call `getUserProfile()`. Since dashboard is a child of app-layout, the profile is fetched twice on every dashboard page load. The dashboard should read from the layout's loader data instead.

### 3. `sanitizeReturnTo` does not block `javascript:` URIs (SECURITY)

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/services/auth/auth-helpers.server.ts` (line 104-108)

The current check only verifies the path starts with `/` and is not `//`. However, paths like `/\evil.com` or URIs with embedded newlines could be problematic depending on downstream usage. More importantly, while `javascript:` URIs fail the `/` check, the function does not reject paths with query strings that could carry malicious data. Consider also stripping or rejecting paths containing backslashes (`\`) which some browsers normalize to `/`.

### 4. `api.session-status.tsx` uses wrong Route type import

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/api.session-status.tsx` (line 32)

The loader uses `{ request: Request }` as a raw type instead of importing `Route.LoaderArgs` from the generated types. This is inconsistent with all other routes and may cause type drift.

### 5. `internal-oauth.login.tsx` uses `fetcher.Form` but submits via page action

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/internal-oauth.login.tsx` (lines 143, 159, 241)

The component creates a `useFetcher()` and uses `fetcher.Form`, but checks `fetcher.state` for loading status while reading `useActionData()` for the result. When using `fetcher.Form`, the result comes from `fetcher.data`, not `useActionData()`. The `isSubmitting` check works, but `actionData` may be stale or empty because the fetcher's action response goes to `fetcher.data`.

The same pattern appears in `internal-oauth.register.tsx`.

**Fix:** Either use `<Form>` (page-level) with `useActionData` + `useNavigation`, or use `fetcher.Form` with `fetcher.data`. Do not mix them.

### 6. Stale section comments in `calendar-week.tsx`

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/features/calendar/components/calendar-week.tsx`

Lines 37 and 149 have misplaced section comments:
- Line 37: `// --- Arrow buttons ---` appears right before the `CalendarWeek` component, not the arrow buttons
- Line 149: `// --- CalendarWeek ---` appears between the two button components

These are swapped and misleading.

---

## Suggestions

### 7. GET /logout should not redirect without session destruction

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/logout.tsx` (line 37-38)

The GET loader redirects to `/login` without destroying the session. While this is CSRF-safe (no state change on GET), a user visiting `/logout` directly in the browser would expect to be logged out. Consider having the GET handler also destroy the session, or showing a confirmation page with a POST form.

### 8. Theme cookie not `httpOnly` by design -- document the trade-off

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/lib/cookies/theme-cookie.server.ts` (line 47)

The comment explains the theme cookie is intentionally not `httpOnly` for the FOUC prevention script. This is a valid trade-off. The inline documentation is good -- no action needed, just noting it was reviewed and accepted.

### 9. `BackendStatus` uses `typeof window === 'undefined'` guard

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/components/features/system/backend-status.tsx`

The SSR guard `if (typeof window === 'undefined') return null` works but could cause hydration mismatches if the component renders differently on server vs client. Since this is inside the authenticated layout (client-navigated), it may not be an issue in practice, but wrapping in a `useIsClient()` hook (which already exists in the codebase) would be more consistent.

### 10. Dashboard is a placeholder -- not a migration fidelity issue yet

**File:** `/Users/genox/projects/tegonal/lasius/frontend_rr7/app/routes/dashboard.tsx`

The dashboard shows a basic profile card. This is clearly WIP and not yet a 1:1 replica of the original. Not flagged as an issue since this is an incremental migration.

### 11. Test coverage gaps

- `session.server.ts` has no unit tests for the sliding-window refresh logic (half-life calculation, fallback `issuedAt`)
- `oauth.callback.tsx` and `oauth.$provider.login.tsx` have no integration tests
- The WebSocket manager has tests (`websocket-manager.test.ts`) which is good

---

## What Was Done Well

- **Security fundamentals are solid**: httpOnly session cookies, sameSite=lax, PKCE with state cookies, proper token revocation on logout, open redirect prevention with `sanitizeReturnTo`
- **Consistent patterns**: All routes follow the same `requireUser` / `mergeAuthHeaders` pattern, AGPL headers on all files, proper use of `logger` from tslog
- **Good separation of concerns**: Auth helpers cleanly separated from session storage, providers abstracted behind an interface
- **Proper React Router 7 patterns**: Type-safe route params via generated types, `shouldRevalidate` for performance, `href()` for type-safe URLs
- **Test coverage for utilities**: `auth-helpers.server.test.ts`, `theme-cookie.server.test.ts`, `dates.test.ts`, `type-guards.test.ts`, `websocket-manager.test.ts`
- **Proper external link attributes**: All external links use `rel="noopener noreferrer"` with `target="_blank"`
- **Good data-testid coverage**: Interactive elements have test IDs following the naming convention
