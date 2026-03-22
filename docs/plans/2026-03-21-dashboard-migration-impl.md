# Dashboard Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Next.js dashboard (`/user/dashboard`) to React Router 7 with tab-based nested routes, URL-driven date selection, and Nivo charts.

**Architecture:** Each time-period tab (Day/Week/Month/6Months/Year) is a nested route under a dashboard layout. The layout provides shared data (user profile, planned hours, org), tab navigation via `NavLink`, and a right sidebar with compact calendar + workload indicator. The selected date lives in `?date=` search params so loaders fetch data server-side.

**Tech Stack:** React Router 7, Nivo charts (`@nivo/stream`, `@nivo/line`, `@nivo/core`), date-fns, React i18next

---

## Existing RR7 utilities (DO NOT recreate)

- `~/lib/api/functions/get-models-booking-summary.ts` — `getModelsBookingSummary(bookings)`
- `~/lib/api/functions/get-expected-vs-booked-percentage.ts` — `getExpectedVsBookedPercentage(expected, worked)`
- `~/lib/api/functions/augment-bookings-list.ts` — `augmentBookingsList(bookings)`
- `~/lib/utils/dates.ts` — `formatISOLocale`, `apiTimespanDay`, `apiTimespanWeek`, `apiTimespanMonth`, `apiTimespanFromTo`, `formatDateTimeToURLParam`
- `~/services/api/lasius/user-bookings/user-bookings.ts` — `getUserBookingListByOrganisation`, `getUserBookingAggregatedStatsByOrganisation`, `getUserBookingCurrent`
- `~/services/api/lasius/user/user.ts` — `getUserProfile`
- `~/services/auth/auth-helpers.server.ts` — `requireUser`, `authHeaders`, `mergeAuthHeaders`
- `~/components/ui/data-display/format-date.tsx` — `FormatDate`

## Original Next.js source files (reference only, do not import)

- `frontend/src/components/features/user/thisMonth/thisMonthStats.tsx` — main dashboard component
- `frontend/src/components/features/user/thisMonth/StatsOverviewGrid.tsx` — 2×2 stat grid
- `frontend/src/components/features/user/thisMonth/TopProjectsCard.tsx` — project ranking
- `frontend/src/components/features/user/index/workLoadIndicator.tsx` — burnout indicator
- `frontend/src/components/features/calendar/calendarMonthCompact.tsx` — compact calendar
- `frontend/src/components/ui/charts/weeklyTrendChart.tsx` — line chart
- `frontend/src/components/ui/charts/monthStreamChartImpl.tsx` — stream chart
- `frontend/src/lib/api/hooks/useWorkHealthMetrics.tsx` — burnout metrics computation
- `frontend/src/lib/api/hooks/useMonthlyWeekStreams.tsx` — month stream data
- `frontend/src/lib/api/functions/aggregateProjectHours.ts` — project aggregation

---

### Task 1: Install Nivo dependencies

**Files:**
- Modify: `frontend_rr7/package.json`

**Step 1: Install packages**

Run:
```bash
cd frontend_rr7 && yarn add @nivo/core@^0.99.0 @nivo/stream@^0.99.0 @nivo/line@^0.99.0
```

**Step 2: Verify installation**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/package.json frontend_rr7/yarn.lock
git commit -m "Add Nivo chart dependencies for dashboard"
```

---

### Task 2: Add utility functions

Port `aggregateProjectHours` and `durationInHoursAsNumber` and date helper for planned working hours.

**Files:**
- Create: `frontend_rr7/app/lib/api/functions/aggregate-project-hours.ts`
- Create: `frontend_rr7/app/lib/utils/duration.ts`
- Create: `frontend_rr7/app/lib/api/functions/get-planned-working-hours.ts`

**Step 1: Create aggregate-project-hours.ts**

Port from `frontend/src/lib/api/functions/aggregateProjectHours.ts`. This function takes the raw stats API response and produces a sorted array of `{ name, hours, percentage }`.

```ts
// AGPL header

export type ProjectSummary = {
  name: string
  hours: number
  percentage: number
}

export const aggregateProjectHours = (
  data: Record<string, unknown>[] | undefined,
  topN?: number,
): ProjectSummary[] => {
  if (!data) return []

  const projectHours: Record<string, number> = {}
  data.forEach((entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      if (key !== 'category' && Array.isArray(value)) {
        const hours = value[0] as number
        if (hours > 0) {
          projectHours[key] = (projectHours[key] || 0) + hours
        }
      }
    })
  })

  let sorted = Object.entries(projectHours).sort(([, a], [, b]) => b - a)
  if (topN !== undefined) {
    sorted = sorted.slice(0, topN)
  }
  const total = sorted.reduce((sum, [, hours]) => sum + hours, 0)

  return sorted.map(([name, hours]) => ({
    name,
    hours,
    percentage: total > 0 ? (hours / total) * 100 : 0,
  }))
}
```

**Step 2: Create duration.ts**

Port `durationInHoursAsNumber` from `frontend/src/lib/utils/date/dates.ts` and `decimalHoursToDurationString`.

```ts
// AGPL header

/** Calculate duration between two ISO date-time strings in hours */
export const durationInHoursAsNumber = (
  start: string,
  end: string,
): number => {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  return (endMs - startMs) / (1000 * 60 * 60)
}

/** Format decimal hours to "Xh Ym" string */
export const decimalHoursToDurationString = (
  value: number | { valueOf(): number },
): string => {
  const hours = typeof value === 'number' ? value : value.valueOf()
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
```

**Step 3: Create get-planned-working-hours.ts**

Server-side utility to compute planned hours for a date range given a user's weekly pattern.

```ts
// AGPL header

import { eachDayOfInterval } from 'date-fns'

const weekdayNames: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export type PlannedWorkingHours = Record<string, number>

const defaultPlannedWorkingHours: PlannedWorkingHours = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
}

/** Get planned hours for a single date */
export const getPlannedHoursForDay = (
  date: Date,
  plannedHours: PlannedWorkingHours | undefined,
): number => {
  const hours = plannedHours ?? defaultPlannedWorkingHours
  const weekday = weekdayNames[date.getDay()] ?? 'monday'
  return hours[weekday] ?? 0
}

/** Sum planned hours across a date interval */
export const getPlannedHoursForRange = (
  start: Date,
  end: Date,
  plannedHours: PlannedWorkingHours | undefined,
): number => {
  const days = eachDayOfInterval({ start, end })
  return days.reduce((sum, day) => sum + getPlannedHoursForDay(day, plannedHours), 0)
}

/** Get weekly planned hours total */
export const getWeeklyPlannedHours = (
  plannedHours: PlannedWorkingHours | undefined,
): number => {
  const hours = plannedHours ?? defaultPlannedWorkingHours
  return Object.values(hours).reduce((sum, h) => sum + h, 0)
}
```

**Step 4: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend_rr7/app/lib/api/functions/aggregate-project-hours.ts \
  frontend_rr7/app/lib/utils/duration.ts \
  frontend_rr7/app/lib/api/functions/get-planned-working-hours.ts
git commit -m "Add dashboard utility functions"
```

---

### Task 3: Add shared dashboard UI components

Port StatsOverviewGrid and TopProjectsCard.

**Files:**
- Create: `frontend_rr7/app/features/dashboard/components/stats-overview-grid.tsx`
- Create: `frontend_rr7/app/features/dashboard/components/top-projects-card.tsx`

**Step 1: Create stats-overview-grid.tsx**

Port from `frontend/src/components/features/user/thisMonth/StatsOverviewGrid.tsx`. Uses DaisyUI `stat` component. Keep the exact same visual structure.

Reference the original for exact markup. Use `useTranslation('common')` from `react-i18next` (not `next-i18next`). Use the `decimalHoursToDurationString` from `~/lib/utils/duration`.

Props:
```ts
type Props = {
  bookings: number
  hours: number
  expectedHours: number
  fulfilledPercentage: number
  period?: 'day' | 'week' | 'month'
}
```

**Step 2: Create top-projects-card.tsx**

Port from `frontend/src/components/features/user/thisMonth/TopProjectsCard.tsx`. Same DaisyUI stat layout with progress bars. Import `ProjectSummary` from `~/lib/api/functions/aggregate-project-hours`.

Props:
```ts
type Props = {
  projects: ProjectSummary[]
  emptyMessage: string
  showTopPrefix?: boolean
}
```

**Step 3: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend_rr7/app/features/dashboard/
git commit -m "Add dashboard stat grid and top projects components"
```

---

### Task 4: Add chart components

Port MonthStreamChart and WeeklyTrendChart with `React.lazy` for client-only rendering.

**Files:**
- Create: `frontend_rr7/app/components/ui/charts/nivo-theme.ts`
- Create: `frontend_rr7/app/components/ui/charts/chart-tooltips.tsx`
- Create: `frontend_rr7/app/components/ui/charts/month-stream-chart.tsx`
- Create: `frontend_rr7/app/components/ui/charts/weekly-trend-chart.tsx`

**Step 1: Create nivo-theme.ts**

Port from `frontend/src/components/ui/charts/nivoTheme.tsx`. Uses DaisyUI CSS variables for theming. Also port the `useNivoColors` hook from `frontend/src/components/ui/charts/shared/getConsistentColor.tsx`.

**Step 2: Create chart-tooltips.tsx**

Port `ChartSingleTooltip` and `ChartStackTooltip` from `frontend/src/components/ui/charts/shared/chartTooltips.tsx`.

**Step 3: Create month-stream-chart.tsx**

Port from `frontend/src/components/ui/charts/monthStreamChartImpl.tsx`. Keep `@ts-nocheck` since Nivo types are loose. Export both a named component and a default export for lazy loading.

**Step 4: Create weekly-trend-chart.tsx**

Port from `frontend/src/components/ui/charts/weeklyTrendChart.tsx`. Uses `@nivo/line` `ResponsiveLine`. Import `decimalHoursToDurationString` from `~/lib/utils/duration`. Export both named and default.

**Step 5: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS (may need ESLint config adjustments for @ts-nocheck in chart files)

**Step 6: Commit**

```bash
git add frontend_rr7/app/components/ui/charts/
git commit -m "Add Nivo chart components for dashboard"
```

---

### Task 5: Dashboard layout route and routing setup

Create the dashboard layout with tab navigation, right sidebar placeholder, and wire into `routes.ts`.

**Files:**
- Create: `frontend_rr7/app/routes/dashboard.tsx`
- Create: `frontend_rr7/app/routes/dashboard._index.tsx`
- Create: `frontend_rr7/app/features/dashboard/components/dashboard-tabs.tsx`
- Modify: `frontend_rr7/app/routes.ts`

**Step 1: Create dashboard-tabs.tsx**

Tab navigation using `NavLink` from React Router. Tabs: Day, Week, Month, 6 Months, Year. Preserves `?date=` search params when switching tabs.

```tsx
// AGPL header
import { useTranslation } from 'react-i18next'
import { NavLink, useSearchParams } from 'react-router'

const tabs = [
  { to: 'day', labelKey: 'common.time.day', defaultValue: 'Day' },
  { to: 'week', labelKey: 'common.time.week', defaultValue: 'Week' },
  { to: 'month', labelKey: 'common.time.month', defaultValue: 'Month' },
  { to: '6months', labelKey: 'workHealth.sixMonths', defaultValue: '6 Months' },
  { to: 'year', labelKey: 'common.time.year', defaultValue: 'Year' },
]

export const DashboardTabs = () => {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const search = dateParam ? `?date=${dateParam}` : ''

  return (
    <div role="tablist" className="tabs tabs-border">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={`${tab.to}${search}`}
          className={({ isActive }) =>
            `tab ${isActive ? 'tab-active' : ''}`
          }
        >
          {t(tab.labelKey, { defaultValue: tab.defaultValue })}
        </NavLink>
      ))}
    </div>
  )
}
```

**Step 2: Create dashboard.tsx layout route**

The layout loader fetches shared data: user profile, selected org, planned working hours. The component renders the 3-column structure (or adapts if already inside home.tsx's grid — check how `home.tsx` renders the center column via `<Outlet />`).

Since `home.tsx` already provides the 3-column grid with left nav, center `<Outlet />`, and right column, `dashboard.tsx` should render:
- Center column: tabs + `<Outlet />`
- The right column content (calendar + workload) needs consideration — `home.tsx` currently has an empty right column. The dashboard layout could use a portal or we accept that the right column is managed by `home.tsx`.

**Approach:** The dashboard layout renders only the center content (tabs + outlet). For the right column, we'll add the calendar and workload indicator in a later task by modifying `home.tsx` to conditionally show sidebar content based on the active route.

For now, the dashboard layout just renders tabs + outlet:

```tsx
// AGPL header
import { Outlet } from 'react-router'
import { DashboardTabs } from '~/features/dashboard/components/dashboard-tabs'

export default function DashboardLayout() {
  return (
    <div className="border-base-100 bg-base-100 text-base-content grid h-full w-full grid-rows-[min-content_auto] overflow-auto border-l">
      <div className="border-b border-base-200 px-4 pt-2">
        <DashboardTabs />
      </div>
      <div className="overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

**Step 3: Create dashboard._index.tsx**

Redirects to `/user/dashboard/month` (default tab), preserving search params.

```tsx
// AGPL header
import { redirect, type LoaderFunctionArgs } from 'react-router'

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = url.search || ''
  throw redirect(`/user/dashboard/month${search}`)
}
```

**Step 4: Wire routes into routes.ts**

Add to the `prefix('user', [...])` block:

```ts
...prefix('user', [
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
]),
```

Note: The tab route files (day, week, etc.) don't exist yet — just create stubs that export a placeholder component and add them in the next tasks. Or add routes only as files are created.

**Step 5: Run checks**

Run: `cd frontend_rr7 && yarn check`

Note: This will fail with missing route files. Create empty stubs for now:

For each of `dashboard.day.tsx`, `dashboard.week.tsx`, `dashboard.month.tsx`, `dashboard.6months.tsx`, `dashboard.year.tsx`:

```tsx
// AGPL header
export default function DashboardTab() {
  return <div className="p-4">Loading...</div>
}
```

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend_rr7/app/routes/dashboard*.tsx \
  frontend_rr7/app/features/dashboard/components/dashboard-tabs.tsx \
  frontend_rr7/app/routes.ts
git commit -m "Add dashboard route structure with tab navigation"
```

---

### Task 6: Dashboard layout loader (shared data)

Add a loader to `dashboard.tsx` that fetches user profile and computes planned working hours for all tabs to access.

**Files:**
- Modify: `frontend_rr7/app/routes/dashboard.tsx`

**Step 1: Add loader**

The loader fetches user profile, determines selected org, and returns planned hours config and org ID. Tab loaders will access this via `useRouteLoaderData` or by receiving it from the route hierarchy.

```ts
import { data } from 'react-router'
import { getUserProfile } from '~/services/api/lasius/user/user'
import { authHeaders, mergeAuthHeaders, requireUser } from '~/services/auth/auth-helpers.server'
import { type Route } from './+types/dashboard'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)
  const profile = await getUserProfile({ headers })
  const user = profile.data
  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''

  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const plannedHours = selectedOrg?.plannedWorkingHours as Record<string, number> | undefined

  return data(
    { selectedOrgId, plannedHours: plannedHours ?? null },
    { headers: mergeAuthHeaders(auth) },
  )
}
```

**Step 2: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS (may need to regenerate route types with `react-router typegen`)

**Step 3: Commit**

```bash
git add frontend_rr7/app/routes/dashboard.tsx
git commit -m "Add dashboard layout loader for shared org and planned hours data"
```

---

### Task 7: Month tab route (default tab)

The month tab is the default — implement it first as the reference for other tabs.

**Files:**
- Modify: `frontend_rr7/app/routes/dashboard.month.tsx`

**Step 1: Add loader**

Read `?date=` from search params (default: today). Fetch month bookings and aggregated project stats. Compute month summary + planned hours.

The loader needs:
1. `getUserBookingListByOrganisation(orgId, monthTimespan, { headers })` — for booking summary
2. `getUserBookingAggregatedStatsByOrganisation(orgId, { source: 'project', from, to, granularity: 'Week' }, { headers })` — for project stats and stream chart data

Access parent loader data: the dashboard layout provides `selectedOrgId` and `plannedHours`. In RR7, child loaders can't directly access parent loader data — they must re-fetch or receive it via context. Since auth is already available via `requireUser`, re-fetch the org ID from the user profile or accept a slight duplication. Alternatively, read it from a cookie or the dashboard layout can put it in a shared context.

**Pragmatic approach:** Each tab loader independently calls `requireUser` + `getUserProfile` to get orgId and planned hours. The profile is cached by the backend and the overhead is minimal. This keeps loaders self-contained.

```ts
import { data } from 'react-router'
import {
  startOfMonth, endOfMonth, eachWeekOfInterval, getWeek, format,
} from 'date-fns'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { getPlannedHoursForRange } from '~/lib/api/functions/get-planned-working-hours'
import { formatISOLocale, apiTimespanMonth, apiTimespanFromTo } from '~/lib/utils/dates'
import { getUserBookingListByOrganisation, getUserBookingAggregatedStatsByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import { authHeaders, mergeAuthHeaders, requireUser } from '~/services/auth/auth-helpers.server'
import { type Route } from './+types/dashboard.month'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  // Get user profile for org selection + planned hours
  const profile = await getUserProfile({ headers })
  const user = profile.data
  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ?? ''

  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const plannedHours = selectedOrg?.plannedWorkingHours as Record<string, number> | undefined

  // Read date from search params
  const url = new URL(request.url)
  const selectedDate = url.searchParams.get('date') || formatISOLocale(new Date())

  const dateObj = new Date(selectedDate)
  const monthStart = startOfMonth(dateObj)
  const monthEnd = endOfMonth(dateObj)
  const monthTimespan = apiTimespanMonth(selectedDate)

  // Fetch month bookings and project stats in parallel
  const monthFromTo = apiTimespanFromTo(
    formatISOLocale(monthStart),
    formatISOLocale(monthEnd),
  )

  const [monthBookingsRes, projectStatsRes] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, monthTimespan, { headers }),
    monthFromTo
      ? getUserBookingAggregatedStatsByOrganisation(
          selectedOrgId,
          { source: 'project', from: monthFromTo.from, to: monthFromTo.to, granularity: 'Week' },
          { headers },
        )
      : Promise.resolve({ data: undefined }),
  ])

  const monthBookings = monthBookingsRes.data ?? []
  const monthSummary = getModelsBookingSummary(monthBookings)
  const plannedHoursMonth = getPlannedHoursForRange(monthStart, monthEnd, plannedHours)
  const { fulfilledPercentage } = getExpectedVsBookedPercentage(plannedHoursMonth, monthSummary.hours)
  const topProjects = aggregateProjectHours(projectStatsRes.data as Record<string, unknown>[] | undefined, 5)

  // Compute stream chart data (week-by-weekday hours matrix)
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hoursMap: Record<string, Record<string, number>> = {}
  weekDays.forEach((day) => {
    hoursMap[day] = {}
    weeks.forEach((weekStart) => {
      const weekNum = getWeek(weekStart, { weekStartsOn: 1 })
      hoursMap[day][`Week ${weekNum}`] = 0
    })
  })

  monthBookings.forEach((booking) => {
    const bookingDate = new Date(booking.start.dateTime)
    const dayName = format(bookingDate, 'EEE')
    const weekNum = getWeek(bookingDate, { weekStartsOn: 1 })
    const weekLabel = `Week ${weekNum}`
    if (hoursMap[dayName]?.[weekLabel] !== undefined) {
      const bookingHours = getModelsBookingSummary([booking]).hours
      hoursMap[dayName][weekLabel] += bookingHours
    }
  })

  const streamData = weekDays.map((day) => {
    const dayData: Record<string, number> = {}
    Object.entries(hoursMap[day]).forEach(([weekLabel, hours]) => {
      dayData[weekLabel] = Number(hours.toFixed(2))
    })
    return dayData
  })

  const streamKeys = [...new Set(
    streamData.flatMap((d) =>
      Object.entries(d).filter(([k, v]) => k.startsWith('Week') && v > 0).map(([k]) => k)
    ),
  )].sort()

  return data(
    {
      selectedDate,
      stats: {
        bookings: monthSummary.elements,
        hours: monthSummary.hours,
        expectedHours: plannedHoursMonth,
        fulfilledPercentage,
      },
      topProjects,
      streamChart: { data: streamData, keys: streamKeys },
    },
    { headers: mergeAuthHeaders(auth) },
  )
}
```

**Step 2: Add component**

```tsx
import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { useLoaderData } from 'react-router'
import { FormatDate } from '~/components/ui/data-display/format-date'
import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { type Route } from './+types/dashboard.month'

const MonthStreamChart = lazy(() => import('~/components/ui/charts/month-stream-chart'))

export default function DashboardMonth({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { stats, topProjects, streamChart, selectedDate } = loaderData
  const dateObj = new Date(selectedDate)

  return (
    <div className="space-y-6 px-8 py-6">
      <h2 className="text-lg font-semibold">
        <FormatDate date={dateObj} format="monthNameLong" />{' '}
        <FormatDate date={dateObj} format="year" />
      </h2>

      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} period="month" />
        <TopProjectsCard
          projects={topProjects}
          emptyMessage={t('statistics.noProjectsForMonth', {
            defaultValue: 'No projects for this month',
          })}
        />
      </div>

      {streamChart.keys.length > 0 && (
        <>
          <h3 className="text-base font-semibold">
            {t('statistics.weeklyHoursDistribution', {
              defaultValue: 'Weekly Hours Distribution',
            })}
          </h3>
          <Suspense fallback={<div className="h-64 w-full animate-pulse rounded bg-base-200" />}>
            <MonthStreamChart data={streamChart.data} keys={streamChart.keys} />
          </Suspense>
        </>
      )}
    </div>
  )
}
```

**Step 3: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend_rr7/app/routes/dashboard.month.tsx
git commit -m "Implement month tab with loader and chart"
```

---

### Task 8: Day and Week tab routes

Follow the same pattern as Month but simpler (no charts).

**Files:**
- Modify: `frontend_rr7/app/routes/dashboard.day.tsx`
- Modify: `frontend_rr7/app/routes/dashboard.week.tsx`

**Step 1: Implement day loader**

- Read `?date=` (default: today)
- Fetch day bookings via `getUserBookingListByOrganisation(orgId, apiTimespanDay(date))`
- Fetch day project stats via `getUserBookingAggregatedStatsByOrganisation(orgId, { source: 'project', from, to, granularity: 'Day' })`
- Compute summary + planned hours for that single day (use `getPlannedHoursForDay`)
- Return `{ selectedDate, stats, topProjects }` (no topN limit — show all day projects, `showTopPrefix: false`)

**Step 2: Implement day component**

```tsx
<h2><FormatDate date={dateObj} format="fullDateShort" /></h2>
<div className="flex gap-4">
  <StatsOverviewGrid {...stats} period="day" />
  <TopProjectsCard projects={topProjects} showTopPrefix={false} emptyMessage={...} />
</div>
```

**Step 3: Implement week loader**

- Read `?date=` (default: today)
- Use `apiTimespanWeek(date)` for the week span
- Fetch week bookings + project stats (granularity: 'Day')
- Compute planned hours for the week using `getPlannedHoursForRange(startOfWeek, endOfWeek, plannedHours)`
- Return `{ selectedDate, weekNumber, stats, topProjects }` (topN: 5)

**Step 4: Implement week component**

```tsx
<h2>{t('common.time.week')} {weekNumber}</h2>
<div className="flex gap-4">
  <StatsOverviewGrid {...stats} period="week" />
  <TopProjectsCard projects={topProjects} emptyMessage={...} />
</div>
```

**Step 5: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend_rr7/app/routes/dashboard.day.tsx frontend_rr7/app/routes/dashboard.week.tsx
git commit -m "Implement day and week dashboard tabs"
```

---

### Task 9: 6-Month and Year tab routes

These tabs include the WeeklyTrendChart and require work health metrics computation server-side.

**Files:**
- Create: `frontend_rr7/app/lib/api/functions/compute-work-health-metrics.server.ts`
- Modify: `frontend_rr7/app/routes/dashboard.6months.tsx`
- Modify: `frontend_rr7/app/routes/dashboard.year.tsx`

**Step 1: Create compute-work-health-metrics.server.ts**

Port the computation logic from `frontend/src/lib/api/hooks/useWorkHealthMetrics.tsx` to a pure server function. Takes bookings array, planned weekly hours, weeks to analyze, and reference date. Returns `{ weeklyData, burnoutMetrics }`.

This is a `.server.ts` file — it only runs on the server in the loader.

Key logic to port:
- Group bookings by week number
- Build `WeekData[]` array (weekNumber, weekLabel, hours, plannedHours, year)
- Calculate burnout metrics from the current (most recent) week
- Return both for the chart and the workload indicator

**Step 2: Implement 6-month loader**

- Read `?date=` (default: today)
- Compute date range: 26 weeks back from reference date
- Fetch bookings for the full range via `getUserBookingListByOrganisation`
- Fetch project stats for the range via `getUserBookingAggregatedStatsByOrganisation`
- Run `computeWorkHealthMetrics(bookings, plannedWeeklyHours, 26, date)`
- Compute summary stats from weeklyData (total hours, total expected, percentage)
- Return `{ selectedDate, stats, topProjects, weeklyData, burnoutMetrics }`

**Step 3: Implement 6-month component**

```tsx
<h2>{t('workHealth.sixMonths')}</h2>
<div className="flex gap-4">
  <StatsOverviewGrid {...stats} />
  <TopProjectsCard projects={topProjects} emptyMessage={...} />
</div>
<h3>{t('workHealth.sixMonthTrend')}</h3>
<Suspense fallback={...}>
  <WeeklyTrendChart weeklyData={weeklyData} />
</Suspense>
```

**Step 4: Implement year loader**

- Read `?date=` and `?year=rolling|calendar` (default: rolling)
- If rolling: 52 weeks back from reference date
- If calendar: start of year to min(end of year, today)
- Same fetch + compute pattern as 6-month
- Return `{ selectedDate, isCalendarYear, stats, topProjects, weeklyData }`

**Step 5: Implement year component**

Same as 6-month but with the calendar year toggle. The toggle navigates with `?year=calendar` or `?year=rolling` search param (preserving `?date=`).

```tsx
const [searchParams, setSearchParams] = useSearchParams()
const isCalendarYear = searchParams.get('year') === 'calendar'

const toggleCalendarYear = () => {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev)
    next.set('year', isCalendarYear ? 'rolling' : 'calendar')
    return next
  })
}
```

**Step 6: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 7: Commit**

```bash
git add frontend_rr7/app/lib/api/functions/compute-work-health-metrics.server.ts \
  frontend_rr7/app/routes/dashboard.6months.tsx \
  frontend_rr7/app/routes/dashboard.year.tsx
git commit -m "Implement 6-month and year dashboard tabs with trend charts"
```

---

### Task 10: Right sidebar — compact calendar + workload indicator

Add the right sidebar content to the dashboard. Since `home.tsx` manages the 3-column grid, we need to render sidebar content from the dashboard context.

**Files:**
- Create: `frontend_rr7/app/features/dashboard/components/calendar-month-compact.tsx`
- Create: `frontend_rr7/app/features/dashboard/components/workload-indicator.tsx`
- Modify: `frontend_rr7/app/routes/dashboard.tsx`
- Possibly modify: `frontend_rr7/app/routes/home.tsx`

**Step 1: Create calendar-month-compact.tsx**

Port from `frontend/src/components/features/calendar/calendarMonthCompact.tsx`. Key changes:
- Replace `useSelectedDate()` (Zustand) with `date` prop from search params
- Replace `onDayClick` → calls `onDateChange(day)` which the parent wires to `setSearchParams`
- Keep `motion/react` animations (already in RR7 deps)
- The `CalendarDataProvider` and `useCalendarDaySummary` may not exist yet in RR7 — start with a simplified version that shows the calendar grid without per-day booking indicators. Add the booking indicators as a follow-up.

Props:
```ts
type Props = {
  date: string           // ISO date string
  onDateChange: (date: string) => void
}
```

**Step 2: Create workload-indicator.tsx**

Port from `frontend/src/components/features/user/index/workLoadIndicator.tsx`. In the RR7 version, this receives data as props (from the layout or child route data) rather than fetching via SWR hooks.

Props:
```ts
type Props = {
  burnoutMetrics: BurnoutMetrics | null
  plannedWeeklyHours: number
  isLoading?: boolean
}
```

Import `BurnoutMetrics` type from `~/lib/api/functions/compute-work-health-metrics.server`. Export the type separately so the client component can import it without pulling in server code.

Actually — create a shared types file:
- Create: `frontend_rr7/app/features/dashboard/types.ts` with `BurnoutMetrics`, `BurnoutLevel`, `WeekData` types

**Step 3: Wire sidebar into dashboard layout**

The challenge: `home.tsx` owns the 3-column grid. The dashboard layout renders inside the center column's `<Outlet />`. The right column is a sibling, not a child.

**Options:**
a) Use React Router's `useMatches()` in `home.tsx` to detect dashboard route and render sidebar content
b) Move the 3-column grid into `dashboard.tsx` (but then it duplicates for other home routes)
c) Use a context/outlet-context pattern

**Recommended: Option (a)** — `home.tsx` checks if the current route is a dashboard route and conditionally renders the sidebar. The dashboard layout exports sidebar data via route handle.

In `dashboard.tsx`:
```ts
export const handle = { sidebar: 'dashboard' }
```

In `home.tsx`, check `useMatches()` for a route with `handle.sidebar === 'dashboard'` and render the calendar/workload sidebar.

But the workload data comes from the child route loader (6months/year compute burnout metrics). For the layout to show it, we need to either:
- Fetch burnout metrics in the dashboard layout loader (separate from tab data)
- Use `useRouteLoaderData` in a sidebar component rendered by the dashboard layout

**Simplest:** Fetch 12-week burnout metrics in the dashboard layout loader. This is a single extra API call and provides the workload indicator data regardless of which tab is active.

Update `dashboard.tsx` loader to also fetch 12-week bookings and compute burnout metrics. Return `burnoutMetrics` alongside `selectedOrgId` and `plannedHours`.

Then `dashboard.tsx` renders the sidebar using Outlet context:

```tsx
// In dashboard.tsx
<div className="flex h-full">
  <div className="flex-1 overflow-auto">
    <DashboardTabs />
    <Outlet />
  </div>
  <div className="hidden w-72 border-l border-base-200 bg-base-200 p-4 md:block">
    <CalendarMonthCompact date={date} onDateChange={handleDateChange} />
    <Divider />
    <WorkloadIndicator burnoutMetrics={burnoutMetrics} ... />
  </div>
</div>
```

But wait — this means the dashboard center column + sidebar are rendered INSIDE `home.tsx`'s center column `<Outlet />`. The right column in `home.tsx` is a separate sibling. We have two options:

**Option A:** Dashboard layout uses its own 2-column grid (center + sidebar) inside home.tsx's center column. The home.tsx right column stays empty for dashboard routes.

**Option B:** Modify `home.tsx` to be dashboard-aware.

**Go with Option A** — it's simpler and self-contained. The home.tsx right column can later be used for other features.

**Step 4: Update home.tsx**

The right column currently has `{/* TODO: IndexColumnTabs */}`. For dashboard routes, we can hide it or keep it empty. No changes needed to `home.tsx` for now.

**Step 5: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend_rr7/app/features/dashboard/components/calendar-month-compact.tsx \
  frontend_rr7/app/features/dashboard/components/workload-indicator.tsx \
  frontend_rr7/app/features/dashboard/types.ts \
  frontend_rr7/app/routes/dashboard.tsx
git commit -m "Add dashboard sidebar with compact calendar and workload indicator"
```

---

### Task 11: Navigation link to dashboard

Add dashboard to the left sidebar navigation.

**Files:**
- Modify: `frontend_rr7/app/features/navigation/components/navigation-menu-tabs.tsx`

**Step 1: Add dashboard link**

Check the existing navigation component and add a link to `/user/dashboard`. Match the original Next.js navigation structure — the dashboard should appear in the same position as in the original app.

Check `frontend/src/components/features/navigation/` for reference on icon and label used.

**Step 2: Run checks**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/navigation/
git commit -m "Add dashboard link to navigation sidebar"
```

---

### Task 12: Visual verification and polish

**Step 1: Manual testing**

Start the dev server (`yarn dev` in frontend_rr7) and verify:
1. Navigate to `/user/dashboard` → redirects to `/user/dashboard/month`
2. All 5 tabs render with correct data
3. Tab switching preserves `?date=` param
4. Calendar date selection updates `?date=` and reloads tab data
5. Charts render (month stream chart, weekly trend chart)
6. Workload indicator shows when metrics warrant it
7. Mobile layout works (single column, no sidebar)
8. Compare with the original Next.js app side-by-side

**Step 2: Fix any visual discrepancies**

Match spacing, fonts, colors with the original. The migration rule says: exact replica of the user-facing appearance.

**Step 3: Run full checks**

Run: `cd frontend_rr7 && yarn check && yarn build`
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "Polish dashboard visual alignment with original"
```
