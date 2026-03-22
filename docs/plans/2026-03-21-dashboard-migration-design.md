# Dashboard Migration Design

## Overview

Migrate the Next.js dashboard (`/user/dashboard`) to React Router 7. The dashboard displays time-tracking statistics across five time periods (Day, Week, Month, 6 Months, Year) with charts, a compact calendar, and a workload indicator.

**Key architectural change:** Tabs become nested routes with their own loaders, and the selected date lives in URL search params instead of Zustand state.

## Route Structure

```
URL                         File                          Purpose
/user/dashboard             dashboard._index.tsx          Redirect → /user/dashboard/month
/user/dashboard/day         dashboard.day.tsx             Day stats + projects
/user/dashboard/week        dashboard.week.tsx            Week stats + projects
/user/dashboard/month       dashboard.month.tsx           Month stats + projects + MonthStreamChart
/user/dashboard/6months     dashboard.6months.tsx         6-month stats + projects + WeeklyTrendChart
/user/dashboard/year        dashboard.year.tsx            Year stats + projects + WeeklyTrendChart
```

Layout file `dashboard.tsx` wraps all tab routes and renders: tab navigation, `<Outlet />` for active tab, and right sidebar (calendar + workload indicator).

### routes.ts Integration

```ts
layout('routes/home.tsx', [
  route('home', 'routes/home._index.tsx'),
  ...prefix('dashboard', [
    layout('routes/dashboard.tsx', [
      index('routes/dashboard._index.tsx'),
      route('day', 'routes/dashboard.day.tsx'),
      route('week', 'routes/dashboard.week.tsx'),
      route('month', 'routes/dashboard.month.tsx'),
      route('6months', 'routes/dashboard.6months.tsx'),
      route('year', 'routes/dashboard.year.tsx'),
    ]),
  ]),
]),
```

## Date Selection via URL Search Params

The selected date is stored in `?date=2026-03-21` (ISO format). Defaults to today when absent.

- **Tab loaders** read `new URL(request.url).searchParams.get('date')` to determine the reference date.
- **Calendar sidebar** updates the URL with `useSearchParams()` — clicking a day navigates to `?date=<clicked>`, which triggers loader revalidation for the active tab.
- **Calendar navigation** (month prev/next) also updates `?date=`.

This replaces the Zustand `useSelectedDate()` store for the dashboard context.

## Data Flow

### Dashboard layout loader (`dashboard.tsx`)

Fetches data shared across all tabs:
- User profile (for org selection and planned working hours)
- Selected org ID (from `user.settings.lastSelectedOrganisation`)
- Planned working hours config (weekly breakdown by weekday)

### Tab loaders

Each tab loader receives the date from search params and fetches only the data it needs:

| Tab | API calls |
|-----|-----------|
| Day | `getUserBookingListByOrganisation(orgId, daySpan)`, `getUserStatsBySourceAndDay(orgId, {source:'project', day})` |
| Week | Same pattern with week span (`startOfWeek` → `endOfWeek`) |
| Month | Month span + monthly week streams data for MonthStreamChart |
| 6 Months | 26-week work health metrics + project stats for the period |
| Year | 52-week (or calendar year via toggle) work health metrics + project stats |

Tab loaders access parent layout data via `Route.ComponentProps` for org ID and planned hours — no redundant fetches.

## Component Structure

### New: `features/dashboard/`

```
features/dashboard/
├── components/
│   ├── stats-overview-grid.tsx    # 2×2 grid: bookings, hours, expected, % fulfilled
│   ├── top-projects-card.tsx      # Ranked project list with progress bars
│   ├── dashboard-tabs.tsx         # Tab navigation using NavLink
│   ├── workload-indicator.tsx     # Burnout risk indicator (migrate from original)
│   └── calendar-month-compact.tsx # Compact month calendar (migrate from original)
├── lib/
│   └── aggregate-project-hours.ts # Project hours aggregation util
```

### Charts (migrated to `components/ui/charts/`)

```
components/ui/charts/
├── nivo-theme.ts                  # Nivo theme config
├── month-stream-chart.tsx         # Stream chart (lazy loaded, client-only)
├── weekly-trend-chart.tsx         # Line chart (lazy loaded, client-only)
```

Charts use `React.lazy()` + `<Suspense>` for client-only rendering (replaces `next/dynamic` with `ssr: false`).

### Migrated stat primitives (as needed)

```
components/ui/data-display/
├── stats-group.tsx
├── stats-tile-hours.tsx
├── stats-tile-number.tsx
├── stats-tile-percentage.tsx
├── format-date.tsx               # (may already exist)
```

## Right Sidebar

The dashboard layout renders the right sidebar directly (not via `home.tsx`'s right column):

```tsx
// dashboard.tsx layout
<div className="grid grid-cols-[auto_18rem]">
  {/* Center: tab nav + Outlet */}
  <div>
    <DashboardTabs />
    <Outlet />
  </div>

  {/* Right: calendar + workload */}
  <div>
    <CalendarMonthCompact date={date} onDateChange={setDate} />
    <WorkloadIndicator ... />
  </div>
</div>
```

The compact calendar becomes a controlled component — it receives `date` from search params and calls `onDateChange` which updates the URL via `useSearchParams`.

The workload indicator data can be loaded in the dashboard layout loader (12-week window for burnout metrics).

## Dependencies

### New npm packages

- `@nivo/core` ^0.99.0
- `@nivo/stream` ^0.99.0
- `@nivo/line` ^0.99.0

### Existing dependencies used

- `date-fns` (already in rr7)
- `lucide-react` (already in rr7)
- `motion/react` (for calendar animations — check if already installed)

## Calendar Adaptation

The original `CalendarMonthCompact` uses:
- `useSelectedDate()` (Zustand) → replaced by `?date=` search param
- `CalendarDataProvider` → needs migration (fetches booking data for calendar day indicators)
- `useCalendarDaySummary` → provides `progressBarPercentage` per day
- `useCalendarNavigation` / `useCalendarSelection` hooks → migrate with URL-based date

The calendar's `onDayClick` will call `setSearchParams({ date: clickedDay })` instead of updating the Zustand store.

## Year Tab: Calendar Year Toggle

The year tab has a client-side toggle (calendar year vs rolling 12 months). This is local UI state (`useState`), not a URL param — it only affects how the loader data is displayed, not what's fetched.

Actually — since the toggle changes the date range, it should either:
1. Be a second search param (`?year=calendar`) so the loader fetches the right range
2. Fetch the full year server-side and let the client slice it

Option 1 is cleaner for the loader pattern. The year loader reads `?year=calendar|rolling` (default: `rolling`).

## Mobile Layout

On mobile, `home.tsx` renders a single-column `<Outlet />`. The dashboard layout should adapt:
- Tabs render as horizontal scrollable nav
- No right sidebar — calendar and workload indicator move above or below the stats
- Or: calendar accessible via a drawer/sheet

Match the original mobile behavior from the Next.js app.
