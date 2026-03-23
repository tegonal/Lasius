# Stats Route Splitting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the monolithic stats loaders into layout + child routes per tab to reduce API calls per navigation and improve perceived performance.

**Architecture:** Parent layout route loads shared data (booking list, summary, date params) and renders tabs + filter + `<Outlet />`. Each tab is a child route with its own loader (2 API calls). Export fetches all data on demand via `useApiProxy` hooks. Follows the existing dashboard pattern exactly.

**Tech Stack:** React Router 7 (layout routes, `shouldRevalidate`, `NavLink`), existing stats chart components, existing API functions.

**Design doc:** `docs/plans/2026-03-23-stats-route-splitting-design.md`

---

### Task 1: Create `StatsTabs` component

**Files:**
- Create: `frontend_rr7/app/features/stats/components/stats-tabs.tsx`
- Reference: `frontend_rr7/app/features/dashboard/components/dashboard-tabs.tsx`

**Step 1: Create the StatsTabs component**

Follow the `DashboardTabs` pattern exactly. Use `NavLink` with `SlidingIndicator`. Preserve `from`, `to`, `dateRange` search params across tab switches.

```tsx
// Accept a `tabs` prop so it works for both user (2 tabs) and org (3 tabs) stats
type StatsTabItem = {
  id: string
  label: string
  to: string
}

type StatsTabsProps = {
  tabs: StatsTabItem[]
}

export const StatsTabs = ({ tabs }: StatsTabsProps) => {
  // Same pattern as DashboardTabs:
  // - useSearchParams() to read from/to/dateRange
  // - Build search string from those params
  // - useLocation() to determine selectedIndex
  // - NavLink with SlidingIndicator
}
```

The tabs array is passed in from the parent layout route, since user stats has 2 tabs and org stats has 3.

**Step 2: Run `yarn check`**

Run: `yarn check` from `frontend_rr7/`
Expected: PASS

**Step 3: Commit**

```
feat: add StatsTabs component for stats route navigation
```

---

### Task 2: Convert `user.stats.tsx` to layout route

**Files:**
- Modify: `frontend_rr7/app/routes/user.stats.tsx` — strip to layout with shared loader
- Create: `frontend_rr7/app/routes/user.stats._index.tsx` — redirect to projects tab
- Create: `frontend_rr7/app/routes/user.stats.projects.tsx` — projects tab child route
- Create: `frontend_rr7/app/routes/user.stats.tags.tsx` — tags tab child route
- Modify: `frontend_rr7/app/routes.ts` — update route config

**Step 1: Update `routes.ts`**

Change the stats route from a leaf to a layout with children:

```ts
// Before:
route('stats', 'routes/user.stats.tsx'),

// After:
...prefix('stats', [
  layout('routes/user.stats.tsx', [
    index('routes/user.stats._index.tsx'),
    route('projects', 'routes/user.stats.projects.tsx'),
    route('tags', 'routes/user.stats.tags.tsx'),
  ]),
]),
```

**Step 2: Rewrite `user.stats.tsx` as layout route**

The loader keeps only shared data:
- `getUserProfile` (1 call)
- `getUserBookingListByOrganisation` (1 call) — for bookingSummary + overview
- Derived: `from`, `to`, `granularity`, `useBarChart`, `selectedOrgId`

The component renders:
- `StatsOverview` (from shared loader data)
- `StatsExport` — **changed to fetch-on-demand** (see Task 4)
- `StatsTabs` with tabs for Projects and Tags
- `StatsFilter` in right column
- `<Outlet />` for child route content

The `shouldRevalidate` stays the same (watches `from`/`to`/`dateRange`).
The `clientLoader` stays the same.

**Step 3: Create `user.stats._index.tsx`**

Redirect to `/user/stats/projects`, preserving search params:

```tsx
import { redirect } from 'react-router'
import { type Route } from './+types/user.stats._index'

export const loader = ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url)
  const search = url.search || ''
  throw redirect(`/user/stats/projects${search}`)
}
```

**Step 4: Create `user.stats.projects.tsx`**

Loader makes 2 API calls:
1. `getUserBookingAggregatedStatsByOrganisation` with `source: 'project', granularity: adaptive`
2. `getUserBookingAggregatedStatsByOrganisation` with `source: 'project', granularity: 'All'`

Read `from`, `to` from search params (same source as parent). Compute `granularity` and `useBarChart` from the date range.

Component renders:
```tsx
<ChartErrorBoundary>
  <StatsCircleCategoryRange chartData={projectsAggregatedChart} />
  <div className="divider my-4" />
  <StatsProjectStream chartData={projectStreamChart} useBarChart={useBarChart} />
</ChartErrorBoundary>
```

Add `shouldRevalidate` watching `from`/`to`/`dateRange`.
Add `clientLoader` with `cachedServerLoader`.

**Step 5: Create `user.stats.tags.tsx`**

Same pattern as projects, but with `source: 'tag'`:
1. `getUserBookingAggregatedStatsByOrganisation` with `source: 'tag', granularity: adaptive`
2. `getUserBookingAggregatedStatsByOrganisation` with `source: 'tag', granularity: 'All'`

Component renders:
```tsx
<ChartErrorBoundary>
  <StatsBarsBySource chartData={tagsByDayChart} groupMode="stacked" />
  <div className="divider my-4" />
  <StatsBarsByAggregatedTags chartData={tagsAggregatedChart} />
</ChartErrorBoundary>
```

**Step 6: Run `yarn check`**

Run: `yarn check` from `frontend_rr7/`
Expected: PASS

**Step 7: Commit**

```
refactor: split user stats into layout + child routes per tab
```

---

### Task 3: Convert `organisation.stats.tsx` to layout route

**Files:**
- Modify: `frontend_rr7/app/routes/organisation.stats.tsx` — strip to layout
- Create: `frontend_rr7/app/routes/organisation.stats._index.tsx` — redirect
- Create: `frontend_rr7/app/routes/organisation.stats.projects.tsx` — projects tab
- Create: `frontend_rr7/app/routes/organisation.stats.users.tsx` — users tab
- Create: `frontend_rr7/app/routes/organisation.stats.tags.tsx` — tags tab
- Modify: `frontend_rr7/app/routes.ts` — update route config

**Step 1: Update `routes.ts`**

```ts
// Before:
route('stats', 'routes/organisation.stats.tsx'),

// After:
...prefix('stats', [
  layout('routes/organisation.stats.tsx', [
    index('routes/organisation.stats._index.tsx'),
    route('projects', 'routes/organisation.stats.projects.tsx'),
    route('users', 'routes/organisation.stats.users.tsx'),
    route('tags', 'routes/organisation.stats.tags.tsx'),
  ]),
]),
```

**Step 2: Rewrite `organisation.stats.tsx` as layout route**

Same pattern as user stats layout but:
- Uses `getOrganisationBookingList` instead of user variant
- Checks admin role (existing behavior)
- `StatsTabs` has 3 tabs: Projects, Users, Tags

**Step 3: Create `organisation.stats._index.tsx`**

Redirect to `/organisation/stats/projects` preserving search params.

**Step 4: Create `organisation.stats.projects.tsx`**

2 API calls with `getOrganisationBookingAggregatedStats`, source `project`.
Same rendering as user stats projects tab.

**Step 5: Create `organisation.stats.users.tsx`**

2 API calls with `getOrganisationBookingAggregatedStats`, source `user`.

Component renders:
```tsx
<ChartErrorBoundary>
  <StatsCircleCategoryRange chartData={usersAggregatedChart} />
  <div className="divider my-4" />
  <StatsUserStream chartData={usersStreamChart} useBarChart={useBarChart} />
</ChartErrorBoundary>
```

**Step 6: Create `organisation.stats.tags.tsx`**

2 API calls with `getOrganisationBookingAggregatedStats`, source `tag`.
Same rendering as user stats tags tab.

**Step 7: Run `yarn check`**

Run: `yarn check` from `frontend_rr7/`
Expected: PASS

**Step 8: Commit**

```
refactor: split org stats into layout + child routes per tab
```

---

### Task 4: Convert StatsExport to fetch-on-demand

**Files:**
- Modify: `frontend_rr7/app/features/stats/components/stats-export.tsx`
- Reference: `frontend_rr7/app/hooks/use-api-proxy.ts`
- Reference: `frontend_rr7/app/lib/utils/statistics-export.ts`

**Step 1: Change StatsExport to fetch data when the button is clicked**

Current: receives all raw data via props from the loader.
New: receives only `from`, `to`, `scope`, `selectedOrgId`, `bookingSummary`, `distinctUsers`, `distinctProjects` via props. When the user clicks Export, it fetches all aggregated stats data via `useApiProxy` (or direct fetch calls), then calls `exportStatistics`.

The component needs:
- A loading state on the export button while fetching
- The `from`/`to`/`scope`/`selectedOrgId` to construct the API calls
- Error handling if any fetch fails

Keep the existing `StatsExportProps` fields that come from the parent loader (`bookingList`, `distinctProjects`, `distinctUsers`, `from`, `to`, `scope`). Remove the per-source raw data props (`projectsByDay`, `tagsByDay`, `usersAggregated`, etc.).

**Step 2: Run `yarn check`**

Run: `yarn check` from `frontend_rr7/`
Expected: PASS

**Step 3: Commit**

```
refactor: convert StatsExport to fetch-on-demand
```

---

### Task 5: Update route constants and navigation

**Files:**
- Modify: `frontend_rr7/app/config/routes.constants.ts`
- Reference: `frontend_rr7/app/config/navigation.ts` (may not need changes — nav links to `/user/stats` which the index route will redirect)

**Step 1: Update route constants**

The existing `ROUTES.USER.STATS` and `ROUTES.ORGANISATION.STATS` stay as-is — they point to the layout route, and the index route handles the redirect. No navigation config changes needed.

However, if any component links directly to `/user/stats` or `/organisation/stats`, verify they still work (the index redirect handles this).

**Step 2: Run `yarn check`**

Run: `yarn check` from `frontend_rr7/`
Expected: PASS

**Step 3: Commit (if any changes)**

```
chore: update route constants for stats sub-routes
```

---

### Task 6: Remove `StatsContent` component

**Files:**
- Delete: `frontend_rr7/app/features/stats/components/stats-content.tsx`
- Verify: no remaining imports of `StatsContent`

**Step 1: Delete the file**

`StatsContent` was the wrapper that rendered tabs with all chart components. Now each child route renders its own charts directly. Delete the file.

**Step 2: Verify no remaining imports**

Search for `StatsContent` imports across the codebase. There should be none after Tasks 2-3 removed them from the layout routes.

**Step 3: Run `yarn check`**

Run: `yarn check` from `frontend_rr7/`
Expected: PASS

**Step 4: Commit**

```
chore: remove StatsContent wrapper (replaced by child routes)
```

---

### Task 7: Manual verification

**Step 1: Start dev server and verify**

Run: `yarn dev` from `frontend_rr7/`

Verify:
- [ ] `/user/stats` redirects to `/user/stats/projects`
- [ ] Projects tab shows pie chart + stream/bar chart
- [ ] Tags tab shows bars-by-source + bars-by-aggregated-tags
- [ ] Tab switching navigates without full page reload
- [ ] Filter (date range) changes update charts on the active tab
- [ ] Switching back to a previously visited tab uses cached data (no spinner)
- [ ] Export button works (fetches data on demand, generates file)
- [ ] `/organisation/stats` redirects to `/organisation/stats/projects`
- [ ] Org stats has 3 tabs: Projects, Users, Tags
- [ ] Users tab shows pie chart + user stream chart
- [ ] Non-admin users get 403 on org stats

**Step 2: Run e2e tests**

Run: `yarn playwright test` from `services/`
Expected: Stats-related e2e tests pass

**Step 3: Commit any fixes**

---

### Task 8: Update e2e tests

**Files:**
- Modify: e2e test files that reference stats pages (check `services/src/e2e/`)

**Step 1: Update any test selectors or URLs**

Stats page URLs change from `/user/stats` to `/user/stats/projects` (after redirect). Update any direct navigation in e2e tests if they bypass the redirect.

**Step 2: Run e2e tests**

Expected: PASS

**Step 3: Commit**

```
test: update e2e tests for stats route splitting
```
