# Stats Route Splitting Design

## Problem

The stats pages (`user.stats.tsx`, `organisation.stats.tsx`) make 5-7 parallel API calls in a single loader. When the date filter changes, the entire loader re-runs, blocking the UI until all calls complete. Charts are lazy-loaded, adding a second loading phase. There's no pending UI, so the user sees nothing happening during the wait.

## Solution

Split stats into layout + child routes per tab, following the dashboard pattern (`dashboard.tsx` + `dashboard.month.tsx`, etc.).

## Route Structure

### User Stats (`/user/stats/...`)

```
user.stats.tsx              → layout: shared data + StatsTabs + filter + Outlet
user.stats._index.tsx       → redirect to /user/stats/projects
user.stats.projects.tsx     → project charts (2 API calls)
user.stats.tags.tsx         → tag charts (2 API calls)
```

### Organisation Stats (`/organisation/stats/...`)

```
organisation.stats.tsx          → layout: shared data + StatsTabs + filter + Outlet
organisation.stats._index.tsx   → redirect to /organisation/stats/projects
organisation.stats.projects.tsx → project charts (2 API calls)
organisation.stats.users.tsx    → user charts (2 API calls)
organisation.stats.tags.tsx     → tag charts (2 API calls)
```

## Data Split

### Parent Layout Loader (shared)

API calls:
- `getUserProfile` (1 call)
- `getOrganisationBookingList` or `getUserBookingListByOrganisation` (1 call)

Computed & returned:
- `bookingSummary` (from bookings list)
- `distinctUsers`, `distinctProjects` (from bookings list)
- `from`, `to` (from search params or defaults)
- `useBarChart`, `granularity` (derived from date range)
- `selectedOrgId`

### Child Route Loaders (per tab)

Each child makes exactly 2 API calls:
1. **By-day stats** — `source: '<tab>', granularity: adaptive` → stream/bar chart
2. **Aggregated stats** — `source: '<tab>', granularity: 'All'` → pie/circle chart

Child loaders access `from`, `to`, `granularity` from search params (same source as parent). They call the API directly — no dependency on parent loader data.

Data transformation (nivo chart formatting) happens in the child loader, server-side.

### Export Behavior

`StatsExport` moves to a fetch-on-demand model:
- The export button fetches all data sources when clicked (projects, tags, users for org)
- This avoids loading export data for tabs the user never visits
- Export uses server-side API calls via a resource route or inline fetch

## Component Changes

### New: `StatsTabs`

Follows `DashboardTabs` pattern exactly:
- `NavLink` per tab with `SlidingIndicator`
- Preserves `from`, `to`, `dateRange` search params across tab switches
- Tabs: Projects, Tags (user) / Projects, Users, Tags (org)

### Modified: `StatsContent`

No longer needed as a wrapper — each child route renders its own chart pair directly (circle/pie + stream/bar). The `ChartErrorBoundary` wrapping stays per child route.

### Modified: `StatsFilter`

Stays in the parent layout (right column). No changes needed — it already writes to search params.

### Modified: `StatsOverview`

Stays in the parent layout. No changes needed — it uses `bookingSummary` from parent loader.

## Revalidation Strategy

**Parent layout** (`shouldRevalidate`):
- Revalidate when `from`, `to`, or `dateRange` search params change
- Same as current behavior

**Child routes** (`shouldRevalidate`):
- Revalidate when `from`, `to`, or `dateRange` change
- Do NOT revalidate on tab switches (path-only changes)
- React Router also revalidates children when parent loader runs, which handles filter changes

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Initial page load API calls | 5-7 | 3-4 (parent 2 + first tab 2) |
| Tab switch API calls | 0 (all pre-loaded) | 2 (lazy per tab) |
| Filter change API calls | 5-7 | 2-4 (parent 2 + active tab 2) |
| Unused tab data loaded | Always | Never |

Trade-off: Tab switching now costs 2 API calls instead of 0, but initial load and filter changes are significantly faster. The `cachedServerLoader` client cache mitigates repeat tab visits within the TTL.
