# Home Center Column Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the authenticated layout into nested routes (app-layout → home layout → home index) and migrate the home center column (progress bar, current booking, booking list) from the Next.js frontend.

**Architecture:** Move the 3-column grid out of `app-layout.tsx` into a new `home.tsx` layout route. The home layout renders left nav + center `<Outlet />` + right column. A child `home._index.tsx` route provides the center column content with its own loader that fetches day bookings and current booking data server-side. The right column content comes from the home layout's own loader.

**Tech Stack:** React Router 7 (file-based routing, loaders), TypeScript, Tailwind CSS + DaisyUI 5, date-fns, motion/react

**Scope boundaries:**
- **In scope:** Route restructuring, center column components (progress bar, current booking display, booking list), server-side data loading
- **Out of scope:** Right column content (BookingStart, favorites, team — future task), left column navigation (future task), booking edit/delete actions, onboarding tutorial, context menus, mobile FAB. These are stubbed where needed.
- **Selected date:** Uses today's date from the loader for now. Date selection via URL search params is a follow-up task.

---

### Task 1: Route restructuring — move 3-col grid to home layout

**Files:**
- Create: `frontend_rr7/app/routes/home.tsx`
- Create: `frontend_rr7/app/routes/home._index.tsx`
- Modify: `frontend_rr7/app/routes/app-layout.tsx`
- Modify: `frontend_rr7/app/routes.ts`
- Delete: `frontend_rr7/app/routes/dashboard.tsx`

**Context:**
Currently `app-layout.tsx` contains the 3-column desktop grid (lines 153). This grid should live in `home.tsx` instead, so other page contexts (projects, settings) can define their own layouts.

**Step 1: Create `home.tsx` layout route**

This layout route owns the 3-column grid. It renders the left nav placeholder, center `<Outlet />`, and right column placeholder. No loader yet (added in Task 4).

```tsx
// frontend_rr7/app/routes/home.tsx
// AGPL header...

import { Suspense } from 'react'
import { Outlet } from 'react-router'

export default function HomeLayout() {
  return (
    <>
      {/* Desktop 3-column layout */}
      <div className="hidden size-full md:flex md:flex-col">
        <section className="h-full w-full overflow-auto">
          <div className="grid size-full grid-cols-[17rem_auto_18rem] overflow-auto lg:grid-cols-[18rem_auto_19rem] xl:grid-cols-[19rem_auto_20rem] 2xl:grid-cols-[19rem_auto_24rem]">
            {/* Left column: navigation sidebar */}
            <div className="h-full w-full rounded-tl-xl">
              {/* NavigationMenuTabs — future task */}
            </div>

            {/* Center: main content */}
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              }
            >
              <Outlet />
            </Suspense>

            {/* Right column: context-dependent sidebar */}
            <div className="border-base-100 bg-base-200 text-base-content flex h-full w-full overflow-auto rounded-tr-xl border-l">
              {/* IndexColumnTabs (BookingStart, favorites, team) — future task */}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile content area */}
      <section className="h-full w-full overflow-hidden md:hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </section>
    </>
  )
}
```

**Step 2: Create `home._index.tsx` stub**

Minimal center column — will be expanded in Tasks 5-8.

```tsx
// frontend_rr7/app/routes/home._index.tsx
// AGPL header...

export default function HomeIndex() {
  return (
    <div className="border-base-100 bg-base-100 text-base-content grid h-full w-full grid-rows-[min-content_min-content_auto] gap-1 overflow-auto border-l">
      <div className="p-4 text-sm text-base-content/60">
        Center column — bookings will render here
      </div>
    </div>
  )
}
```

**Step 3: Simplify `app-layout.tsx`**

Remove the 3-column grid from `app-layout.tsx`. Keep header + footer + single `<Outlet />`.

The desktop content area changes from the current 3-column grid (lines 151-172) to a simple container with `<Outlet />`. The footer stays in app-layout since it's shared across all pages.

Replace the desktop content area section (the `<div>` containing the 3-col grid, footer, etc.) with:

```tsx
{/* Desktop content area */}
<div className="bg-base-200 border-base-content/20 hidden h-full w-full overflow-hidden rounded-xl border shadow-2xl md:flex md:flex-col">
  <Suspense
    fallback={
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    }
  >
    <Outlet />
  </Suspense>

  {/* Desktop footer */}
  <footer className="border-base-content/20 bg-base-100 flex items-center justify-between border-t px-3 py-2">
    <TegonalFooter variant="compact" />
  </footer>
</div>

{/* Mobile content area */}
<section className="bg-base-200 h-full w-full overflow-hidden md:hidden">
  <Suspense
    fallback={
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    }
  >
    <Outlet />
  </Suspense>
</section>
```

Remove the now-unused Suspense import if it was only used for the old section (it's still used, so keep it).

**Step 4: Update `routes.ts`**

Replace:
```ts
layout('routes/app-layout.tsx', [index('routes/dashboard.tsx')]),
```

With:
```ts
layout('routes/app-layout.tsx', [
  layout('routes/home.tsx', [
    index('routes/home._index.tsx'),
  ]),
]),
```

**Step 5: Delete `dashboard.tsx`**

Remove the old stub file.

**Step 6: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: passes — no type errors, the app renders with header + empty 3-col grid + footer.

**Step 7: Commit**

```bash
git add frontend_rr7/app/routes/home.tsx frontend_rr7/app/routes/home._index.tsx frontend_rr7/app/routes/app-layout.tsx frontend_rr7/app/routes.ts
git rm frontend_rr7/app/routes/dashboard.tsx
git commit -m "refactor: extract 3-column grid into home layout route"
```

---

### Task 2: Add missing date utilities

**Files:**
- Modify: `frontend_rr7/app/lib/utils/dates.ts`

**Context:**
The RR7 app already has `formatISOLocale`, `apiTimespanWeek`, `apiTimespanMonth`. The center column needs `apiTimespanDay` and `apiTimespanFromTo` for data loading.

**Step 1: Write tests for the new functions**

```ts
// Add to frontend_rr7/app/lib/utils/dates.test.ts

describe('apiTimespanDay', () => {
  it('returns from/to spanning the full day', () => {
    const result = apiTimespanDay('2026-03-15T10:00:00.000+01:00')
    expect(result.from).toContain('2026-03-15T00:00:00.000')
    expect(result.to).toContain('2026-03-15T23:59:59.999')
  })
})

describe('apiTimespanFromTo', () => {
  it('returns from/to spanning start of from-day to end of to-day', () => {
    const result = apiTimespanFromTo(
      '2026-03-01T10:00:00.000+01:00',
      '2026-03-15T10:00:00.000+01:00'
    )
    expect(result).not.toBeNull()
    expect(result!.from).toContain('2026-03-01T00:00:00.000')
    expect(result!.to).toContain('2026-03-15T23:59:59.999')
  })

  it('returns null for empty strings', () => {
    expect(apiTimespanFromTo('', '')).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend_rr7 && yarn vitest run app/lib/utils/dates.test.ts`
Expected: FAIL — functions not exported

**Step 3: Implement `apiTimespanDay` and `apiTimespanFromTo`**

Add to `frontend_rr7/app/lib/utils/dates.ts`:

```ts
import { endOfDay, startOfDay, isValid } from 'date-fns' // add endOfDay, startOfDay, isValid to existing imports

// Add after existing apiTimespanMonth:

/**
 * Get from and to date spanning the entire day
 */
export const apiTimespanDay = (
  date: IsoDateString,
): { from: ApiDateParam; to: ApiDateParam } => {
  const dateObj = new Date(date)
  return {
    from: formatDateTimeToURLParam(startOfDay(dateObj)),
    to: formatDateTimeToURLParam(endOfDay(dateObj)),
  }
}

/**
 * Get from and to spanning start-of-from-day to end-of-to-day.
 * Returns null for empty/invalid dates (skip API call).
 */
export const apiTimespanFromTo = (
  from: IsoDateString,
  to: IsoDateString,
): { from: ApiDateParam; to: ApiDateParam } | null => {
  if (!from || !to) return null
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (!isValid(fromDate) || !isValid(toDate)) return null
  return {
    from: formatDateTimeToURLParam(startOfDay(fromDate)),
    to: formatDateTimeToURLParam(endOfDay(toDate)),
  }
}
```

Also export `formatDateTimeToURLParam` (currently module-private) — the loader needs it:

Change `const formatDateTimeToURLParam` to `export const formatDateTimeToURLParam`.

**Step 4: Run tests to verify they pass**

Run: `cd frontend_rr7 && yarn vitest run app/lib/utils/dates.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend_rr7/app/lib/utils/dates.ts frontend_rr7/app/lib/utils/dates.test.ts
git commit -m "feat: add apiTimespanDay and apiTimespanFromTo date utilities"
```

---

### Task 3: Add booking data utility functions

**Files:**
- Create: `frontend_rr7/app/lib/api/functions/get-models-booking-summary.ts`
- Create: `frontend_rr7/app/lib/api/functions/get-extended-models-booking-list.ts`
- Create: `frontend_rr7/app/lib/api/functions/get-expected-vs-booked-percentage.ts`
- Create: `frontend_rr7/app/lib/api/functions/augment-bookings-list.ts`
- Create: `frontend_rr7/app/lib/api/functions/sort-bookings-by-date.ts`
- Create: `frontend_rr7/app/lib/utils/duration.ts`

**Context:**
These pure functions compute booking summaries, progress percentages, and augment booking lists. They are used by both the loader (server-side) and UI components (client-side). Ported 1:1 from the original with import path adjustments.

**Step 1: Create `duration.ts` utility**

Duration formatting functions needed by the progress bar and booking list.

```ts
// frontend_rr7/app/lib/utils/duration.ts
// AGPL header...

import { differenceInMilliseconds, differenceInMinutes } from 'date-fns'
import type { IsoDateString } from '~/lib/utils/dates'

/**
 * Calculate duration between two ISO date strings in decimal hours.
 */
export const durationInHoursAsNumber = (
  start: IsoDateString,
  end: IsoDateString,
): number => {
  const ms = differenceInMilliseconds(new Date(end), new Date(start))
  return ms / 1000 / 60 / 60
}

/**
 * Format duration between two ISO date strings as "HH:MM".
 */
export const durationAsString = (
  start: IsoDateString,
  end: IsoDateString,
): string => {
  const minutes = differenceInMinutes(new Date(end), new Date(start))
  return decimalMinutesToTimeString(minutes)
}

/**
 * Convert decimal minutes to "HH:MM" string.
 */
const decimalMinutesToTimeString = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.abs(totalMinutes % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Convert decimal hours to "HH:MM" string.
 */
export const decimalHoursToDurationString = (
  decimalHours: number,
): string => {
  const totalMinutes = Math.round(decimalHours * 60)
  return decimalMinutesToTimeString(totalMinutes)
}
```

**Step 2: Create `get-extended-models-booking-list.ts`**

```ts
// frontend_rr7/app/lib/api/functions/get-extended-models-booking-list.ts
// AGPL header...

import { format } from 'date-fns'
import type { ModelsBooking } from '~/services/api/lasius'
import { durationAsString, durationInHoursAsNumber } from '~/lib/utils/duration'

const DATE_FORMAT_SHORT = 'd.M.y'
const TIME_FORMAT = 'HH:mm'

export const getExtendedModelsBookingList = (list: ModelsBooking[]) =>
  list.map((booking) => ({
    ...booking,
    date: format(new Date(booking.start.dateTime), DATE_FORMAT_SHORT),
    fromTo: `${format(new Date(booking.start.dateTime), TIME_FORMAT)} - ${format(
      new Date(booking.end?.dateTime || ''),
      TIME_FORMAT,
    )}`,
    duration: durationInHoursAsNumber(booking.start.dateTime, booking.end?.dateTime || ''),
    durationString: durationAsString(booking.start.dateTime, booking.end?.dateTime || ''),
  }))
```

**Step 3: Create `get-models-booking-summary.ts`**

```ts
// frontend_rr7/app/lib/api/functions/get-models-booking-summary.ts
// AGPL header...

import type { ModelsBooking } from '~/services/api/lasius'
import { getExtendedModelsBookingList } from './get-extended-models-booking-list'

export const getModelsBookingSummary = (list: ModelsBooking[]) => {
  const hours = Math.round(
    getExtendedModelsBookingList(list).reduce((acc, item) => acc + item.duration, 0) * 100,
  ) / 100
  const elements = list.length
  return { hours, elements }
}
```

**Step 4: Create `get-expected-vs-booked-percentage.ts`**

```ts
// frontend_rr7/app/lib/api/functions/get-expected-vs-booked-percentage.ts
// AGPL header...

export const getExpectedVsBookedPercentage = (expected: number, worked: number) => {
  let fulfilledPercentage = 0
  if (worked === 0) fulfilledPercentage = 0
  if (expected === 0 && worked > 0) fulfilledPercentage = 100
  if (expected > 0 && worked > 0)
    fulfilledPercentage = Math.round((worked / expected) * 100 * 100) / 100

  const progressBarPercentage =
    fulfilledPercentage > 90 && fulfilledPercentage < 100
      ? 90
      : fulfilledPercentage > 100
        ? 100
        : fulfilledPercentage

  return { fulfilledPercentage, progressBarPercentage }
}
```

**Step 5: Create `sort-bookings-by-date.ts`**

```ts
// frontend_rr7/app/lib/api/functions/sort-bookings-by-date.ts
// AGPL header...

import type { ModelsBooking } from '~/services/api/lasius'

export const sortBookingsByDate = (bookings: ModelsBooking[]): ModelsBooking[] =>
  [...bookings].sort(
    (a, b) => new Date(b.start.dateTime).getTime() - new Date(a.start.dateTime).getTime(),
  )
```

**Step 6: Create `augment-bookings-list.ts`**

```ts
// frontend_rr7/app/lib/api/functions/augment-bookings-list.ts
// AGPL header...

import { differenceInMinutes, isBefore } from 'date-fns'
import type { ModelsBooking } from '~/services/api/lasius'
import { sortBookingsByDate } from './sort-bookings-by-date'

export type AugmentedBooking = ModelsBooking & {
  overlapsWithNext?: ModelsBooking
  isMostRecent?: boolean
  hasNextItem?: boolean
  allowInsert?: boolean
}

export const augmentBookingsList = (bookings: ModelsBooking[]): AugmentedBooking[] => {
  const sorted = sortBookingsByDate(bookings)

  return sorted.map((booking, index) => {
    const nextBooking = sorted[index + 1]
    const isMostRecent = index === 0
    const hasNextItem = index < sorted.length - 1

    if (nextBooking && booking.end && nextBooking.end) {
      const isOverlapping =
        nextBooking.end.dateTime !== booking.start.dateTime &&
        !isBefore(new Date(nextBooking.end.dateTime), new Date(booking.start.dateTime))

      const hasGap =
        differenceInMinutes(
          new Date(booking.start.dateTime),
          new Date(nextBooking.end.dateTime),
        ) > 1

      return {
        ...booking,
        overlapsWithNext: isOverlapping ? nextBooking : undefined,
        isMostRecent,
        hasNextItem,
        allowInsert: hasGap,
      }
    }

    return { ...booking, isMostRecent, hasNextItem }
  })
}
```

**Step 7: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 8: Commit**

```bash
git add frontend_rr7/app/lib/utils/duration.ts frontend_rr7/app/lib/api/functions/
git commit -m "feat: add booking data utility functions"
```

---

### Task 4: Home index loader — fetch day bookings server-side

**Files:**
- Modify: `frontend_rr7/app/routes/home._index.tsx`
- Modify: `frontend_rr7/app/routes/home.tsx` (add loader for right column data)

**Context:**
The loader fetches day bookings and current booking from the backend using the Orval-generated fetch functions. It reads the access token from the app-layout loader data via the request session. For now, it uses today's date. The `authHeaders` helper is already available from `~/services/auth/auth-helpers.server`.

Reference: The app-layout loader at `frontend_rr7/app/routes/app-layout.tsx:66-83` shows the pattern — use `requireUser(request)` to get auth, then call API functions with `authHeaders(auth.session)`.

**Step 1: Add loader to `home._index.tsx`**

```tsx
// frontend_rr7/app/routes/home._index.tsx
// AGPL header...

import { data } from 'react-router'
import {
  getUserBookingCurrent,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'
import { apiTimespanDay, formatISOLocale } from '~/lib/utils/dates'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { augmentBookingsList } from '~/lib/api/functions/augment-bookings-list'
import type { Route } from './+types/home._index'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  // Get user profile for planned working hours + org selection
  const profile = await getUserProfile({ headers })
  const user = profile.data
  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''

  // Today's date as default (future: read from URL search param)
  const today = formatISOLocale(new Date())
  const dayTimespan = apiTimespanDay(today)

  // Fetch day bookings and current booking in parallel
  const [dayBookingsRes, currentBookingRes] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, dayTimespan, { headers }),
    getUserBookingCurrent({ headers }),
  ])

  const dayBookings = dayBookingsRes.data ?? []
  const currentBooking = currentBookingRes.data

  // Compute planned working hours for today's weekday
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const plannedHours = selectedOrg?.plannedWorkingHours
  const weekdayNames = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
  ] as const
  const todayWeekday = weekdayNames[new Date().getDay()]
  const plannedHoursDay = (plannedHours as Record<string, number> | undefined)?.[todayWeekday] ?? 0

  // Compute day summary
  const daySummary = getModelsBookingSummary(dayBookings)
  const { fulfilledPercentage, progressBarPercentage } = getExpectedVsBookedPercentage(
    plannedHoursDay,
    daySummary.hours,
  )

  // Augment bookings list for display
  const augmentedBookings = augmentBookingsList(dayBookings)

  return data(
    {
      augmentedBookings,
      currentBooking,
      daySummary: {
        ...daySummary,
        plannedWorkingHours: plannedHoursDay,
        fulfilledPercentage,
        progressBarPercentage,
      },
      selectedDate: today,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

export default function HomeIndex() {
  // UI components added in Tasks 5-8
  return (
    <div className="border-base-100 bg-base-100 text-base-content grid h-full w-full grid-rows-[min-content_min-content_auto] gap-1 overflow-auto border-l">
      <div className="p-4 text-sm text-base-content/60">
        Loader data ready — UI components next
      </div>
    </div>
  )
}
```

**Step 2: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS (type-check the loader)

Note: The `ModelsBooking` type from Orval may need the `end` field to be optional. Check `frontend_rr7/app/services/api/lasius/modelsBooking.ts` — if `end` is typed as required but the API returns it as optional for current bookings, adjust the type usage accordingly.

**Step 3: Commit**

```bash
git add frontend_rr7/app/routes/home._index.tsx
git commit -m "feat: add home index loader with day bookings and current booking"
```

---

### Task 5: ProgressBar component

**Files:**
- Create: `frontend_rr7/app/components/ui/data-display/progress-bar.tsx`

**Context:**
Animated progress bar using motion/react. Shows main bar (0-100%) and overflow bar (>100% in warning color). Matches the original at `frontend/src/components/ui/data-display/ProgressBar.tsx`.

Simplification: The original uses `useGlobalLoading` from a UI store and `triggerExplosion` for a confetti effect. For now, skip the explosion effect and global loading check — just animate the bar.

**Step 1: Create the component**

```tsx
// frontend_rr7/app/components/ui/data-display/progress-bar.tsx
// AGPL header...

import { m } from 'motion/react'
import { memo } from 'react'

export const ProgressBar = memo(
  ({ percentage, label }: { percentage: number; label: string }) => {
    const visualPercentage =
      percentage >= 100 ? 100 : Math.min(percentage, 97)
    const normalizedDisplayPercentage = Math.min(visualPercentage, 100)
    const overflowDisplayPercentage = Math.max(0, percentage - 100)

    const mainBarDuration = 1
    const overflowBarDelay =
      normalizedDisplayPercentage === 100 ? mainBarDuration : 0

    return (
      <div className="relative w-full" title={label}>
        <div className="space-y-[2px]">
          {/* Main progress bar */}
          <div className="bg-base-content/25 relative h-[5px] w-full overflow-visible text-[10px]">
            <div className="absolute inset-0 overflow-hidden">
              <m.div
                className="bg-secondary dark:bg-base-content/75 h-full max-w-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${normalizedDisplayPercentage}%`,
                }}
                transition={{
                  duration: mainBarDuration,
                  ease: 'easeInOut',
                }}
                style={{ willChange: 'width' }}
              />
            </div>
          </div>
          {/* Overflow bar — fills when > 100% */}
          <div className="bg-base-content/15 h-[3px] w-full overflow-hidden">
            {percentage > 100 && (
              <m.div
                className="bg-warning h-full max-w-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(overflowDisplayPercentage, 100)}%`,
                }}
                transition={{
                  duration: 1,
                  ease: 'easeInOut',
                  delay: overflowBarDelay,
                }}
                style={{ willChange: 'width' }}
              />
            )}
          </div>
        </div>
      </div>
    )
  },
)
```

**Step 2: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/components/ui/data-display/progress-bar.tsx
git commit -m "feat: add animated ProgressBar component"
```

---

### Task 6: BookingDayStatsProgressBar component

**Files:**
- Create: `frontend_rr7/app/features/home/components/booking-day-stats-progress-bar.tsx`

**Context:**
Reads day summary from the home._index loader data and renders the progress bar with a formatted label. The original uses a live-updating `useGetBookingProgressDay` hook that adds current booking duration every second. For the loader-based version, the progress bar shows the server-computed percentage. Live progress updates will be added when WebSocket integration is done (future task).

**Step 1: Create the component**

```tsx
// frontend_rr7/app/features/home/components/booking-day-stats-progress-bar.tsx
// AGPL header...

import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import { ProgressBar } from '~/components/ui/data-display/progress-bar'
import { decimalHoursToDurationString } from '~/lib/utils/duration'

export const BookingDayStatsProgressBar = () => {
  const { t } = useTranslation('common')
  const loaderData = useRouteLoaderData('routes/home._index') as
    | { daySummary: { fulfilledPercentage: number; hours: number; plannedWorkingHours: number } }
    | undefined

  const daySummary = loaderData?.daySummary
  if (!daySummary) return null

  const label = `${daySummary.fulfilledPercentage}% (${decimalHoursToDurationString(daySummary.hours)} ${t(
    'of',
    { defaultValue: 'of' },
  )} ${decimalHoursToDurationString(daySummary.plannedWorkingHours)})`

  return (
    <div className="w-full">
      <ProgressBar
        percentage={daySummary.fulfilledPercentage}
        label={label}
      />
    </div>
  )
}
```

**Step 2: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/home/components/booking-day-stats-progress-bar.tsx
git commit -m "feat: add BookingDayStatsProgressBar component"
```

---

### Task 7: BookingCurrent component

**Files:**
- Create: `frontend_rr7/app/features/bookings/components/booking-current.tsx`

**Context:**
Displays the currently running booking or a "no booking" placeholder. The original has a stop button, duration counter, booking name, tags, and a context menu. For this task, create a simplified version that shows the booking info and a stop button stub. The full context menu, edit actions, and midnight split logic are future tasks.

The component reads `currentBooking` from the home._index loader data.

**Step 1: Create the component**

```tsx
// frontend_rr7/app/features/bookings/components/booking-current.tsx
// AGPL header...

import { SquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import type { ModelsCurrentUserTimeBooking } from '~/services/api/lasius/modelsCurrentUserTimeBooking'

export const BookingCurrent = () => {
  const { t } = useTranslation('common')
  const loaderData = useRouteLoaderData('routes/home._index') as
    | { currentBooking: ModelsCurrentUserTimeBooking | undefined }
    | undefined

  const currentBooking = loaderData?.currentBooking

  return (
    <div className="bg-base-200 relative flex h-full min-h-[96px] w-full flex-row items-center gap-3 overflow-hidden px-2 py-3 sm:px-3 md:bg-transparent lg:px-4 [&>*]:w-full">
      {!currentBooking?.booking ? (
        <NoBooking />
      ) : (
        <CurrentBookingEntry booking={currentBooking.booking} />
      )}
    </div>
  )
}

const NoBooking = () => {
  const { t } = useTranslation('common')
  return (
    <div className="flex items-center justify-center gap-2 text-base-content/60">
      <span className="text-sm">
        {t('bookings.noCurrentBooking', {
          defaultValue: 'No booking running',
        })}
      </span>
    </div>
  )
}

const CurrentBookingEntry = ({
  booking,
}: {
  booking: NonNullable<ModelsCurrentUserTimeBooking['booking']>
}) => {
  const { t } = useTranslation('common')

  const projectName =
    booking.projectReference?.key ?? t('bookings.unknownProject', { defaultValue: 'Unknown' })

  return (
    <div className="grid h-full w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:gap-4">
      <Button
        variant="ghost"
        title={t('bookings.actions.stopRecording', {
          defaultValue: 'Stop recording current time booking',
        })}
        fullWidth={false}
        className="text-error"
      >
        <LucideIcon icon={SquareIcon} size={24} />
      </Button>
      <div className="flex w-full min-w-0 flex-col gap-1 overflow-hidden leading-normal">
        <span className="truncate font-semibold">{projectName}</span>
        {booking.tags && booking.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {booking.tags.map((tag) => (
              <span
                key={`${tag.id}-${tag.type}`}
                className="badge badge-sm badge-outline"
              >
                {tag.id}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-base-content/60 text-sm">
        {booking.start?.dateTime &&
          new Date(booking.start.dateTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
      </div>
    </div>
  )
}
```

**Step 2: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

Check that `ModelsCurrentUserTimeBooking` type exists at `frontend_rr7/app/services/api/lasius/modelsCurrentUserTimeBooking.ts` and has the expected shape (booking with projectReference, tags, start).

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/bookings/components/booking-current.tsx
git commit -m "feat: add BookingCurrent component"
```

---

### Task 8: BookingListSelectedDay component

**Files:**
- Create: `frontend_rr7/app/features/bookings/components/booking-list-selected-day.tsx`
- Create: `frontend_rr7/app/features/bookings/components/booking-item.tsx`

**Context:**
Renders the list of bookings for the selected day. The original has complex empty states (onboarding tutorial, "never booked", "no bookings today") and animated list transitions. For this migration, implement the booking list with items and basic empty state. Onboarding tutorial is out of scope.

The component reads `augmentedBookings` from the home._index loader data.

**Step 1: Create `booking-item.tsx`**

A simplified booking item showing project name, time range, duration, and tags. The original has context menus, edit modals, overlap indicators, and insert actions — those are future tasks.

```tsx
// frontend_rr7/app/features/bookings/components/booking-item.tsx
// AGPL header...

import { format } from 'date-fns'
import type { AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { durationAsString } from '~/lib/utils/duration'

const TIME_FORMAT = 'HH:mm'

export const BookingItem = ({ item }: { item: AugmentedBooking }) => {
  const startTime = format(new Date(item.start.dateTime), TIME_FORMAT)
  const endTime = item.end
    ? format(new Date(item.end.dateTime), TIME_FORMAT)
    : '...'
  const duration = item.end
    ? durationAsString(item.start.dateTime, item.end.dateTime)
    : ''

  const projectName = item.projectReference?.key ?? 'Unknown'

  return (
    <div className="border-base-content/10 flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{projectName}</span>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span
                key={`${tag.id}-${tag.type}`}
                className="badge badge-xs badge-outline"
              >
                {tag.id}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-base-content/60 flex flex-col items-end text-sm">
        <span>
          {startTime} – {endTime}
        </span>
        {duration && (
          <span className="text-xs">{duration}</span>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create `booking-list-selected-day.tsx`**

```tsx
// frontend_rr7/app/features/bookings/components/booking-list-selected-day.tsx
// AGPL header...

import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import type { AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { BookingItem } from './booking-item'

export const BookingListSelectedDay = () => {
  const { t } = useTranslation('common')
  const loaderData = useRouteLoaderData('routes/home._index') as
    | { augmentedBookings: AugmentedBooking[] }
    | undefined

  const bookings = loaderData?.augmentedBookings ?? []

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-base-content/60">
        <span className="text-sm">
          {t('bookings.noBookingsToday', {
            defaultValue: 'No bookings for this day',
          })}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {bookings.map((item) => (
        <BookingItem key={item.id} item={item} />
      ))}
    </div>
  )
}
```

**Step 3: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend_rr7/app/features/bookings/components/booking-item.tsx frontend_rr7/app/features/bookings/components/booking-list-selected-day.tsx
git commit -m "feat: add BookingListSelectedDay and BookingItem components"
```

---

### Task 9: Wire center column into home._index

**Files:**
- Modify: `frontend_rr7/app/routes/home._index.tsx`

**Context:**
Replace the placeholder content in `home._index.tsx` with the three center column components. Import and render `BookingDayStatsProgressBar`, `BookingCurrent`, and `BookingListSelectedDay` in the same grid layout as the original.

**Step 1: Update the default export**

Replace the placeholder `HomeIndex` component with:

```tsx
import { ScrollContainer } from '~/components/primitives/layout/scroll-container'
import { BookingCurrent } from '~/features/bookings/components/booking-current'
import { BookingDayStatsProgressBar } from '~/features/home/components/booking-day-stats-progress-bar'
import { BookingListSelectedDay } from '~/features/bookings/components/booking-list-selected-day'
import type { Route } from './+types/home._index'

// ... loader stays as-is from Task 4 ...

export default function HomeIndex(_props: Route.ComponentProps) {
  return (
    <div className="border-base-100 bg-base-100 text-base-content grid h-full w-full grid-rows-[min-content_min-content_auto] gap-1 overflow-auto border-l">
      <BookingDayStatsProgressBar />
      <BookingCurrent />
      <ScrollContainer>
        <BookingListSelectedDay />
      </ScrollContainer>
    </div>
  )
}
```

**Step 2: Verify**

Run: `cd frontend_rr7 && yarn check`
Expected: PASS

**Step 3: Manual verification**

Start the dev server and navigate to `http://localhost:3000`. Verify:
- Header with calendar week, org switcher, help button, logout
- 3-column layout: empty left nav | center content | empty right column
- Center shows: progress bar at top, current booking area, booking list below
- If logged in with demo credentials, bookings should appear

**Step 4: Commit**

```bash
git add frontend_rr7/app/routes/home._index.tsx
git commit -m "feat: wire center column components into home index route"
```

---

## Summary of created/modified files

| Action | Path |
|--------|------|
| Create | `frontend_rr7/app/routes/home.tsx` |
| Create | `frontend_rr7/app/routes/home._index.tsx` |
| Delete | `frontend_rr7/app/routes/dashboard.tsx` |
| Modify | `frontend_rr7/app/routes/app-layout.tsx` |
| Modify | `frontend_rr7/app/routes.ts` |
| Modify | `frontend_rr7/app/lib/utils/dates.ts` |
| Modify | `frontend_rr7/app/lib/utils/dates.test.ts` |
| Create | `frontend_rr7/app/lib/utils/duration.ts` |
| Create | `frontend_rr7/app/lib/api/functions/get-models-booking-summary.ts` |
| Create | `frontend_rr7/app/lib/api/functions/get-extended-models-booking-list.ts` |
| Create | `frontend_rr7/app/lib/api/functions/get-expected-vs-booked-percentage.ts` |
| Create | `frontend_rr7/app/lib/api/functions/sort-bookings-by-date.ts` |
| Create | `frontend_rr7/app/lib/api/functions/augment-bookings-list.ts` |
| Create | `frontend_rr7/app/components/ui/data-display/progress-bar.tsx` |
| Create | `frontend_rr7/app/features/home/components/booking-day-stats-progress-bar.tsx` |
| Create | `frontend_rr7/app/features/bookings/components/booking-current.tsx` |
| Create | `frontend_rr7/app/features/bookings/components/booking-item.tsx` |
| Create | `frontend_rr7/app/features/bookings/components/booking-list-selected-day.tsx` |

## Future tasks (out of scope)

- **Date selection via URL search params** — currently hardcoded to today
- **Right column** — BookingStart, favorites, team member list (IndexColumnTabs)
- **Left column** — NavigationMenuTabs
- **Booking actions** — stop, edit, delete, add, context menus
- **Live progress updates** — current booking duration counter (WebSocket or interval)
- **Onboarding tutorial** — empty state for new users
- **Mobile layout** — different component order, floating action button
- **Animations** — AnimateList, AnimateChange transitions
