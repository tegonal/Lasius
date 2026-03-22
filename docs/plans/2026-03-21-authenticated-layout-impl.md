# Authenticated Layout + Header Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the authenticated app header with calendar week navigation and organisation switcher from Next.js to React Router 7, matching the original 1:1 in design and UX.

**Architecture:** Nested outlet layout with shared loader (user profile, orgs, settings). Calendar state in Zustand. All backend calls via resource route loaders/actions + `useFetcher`. Feature components in `app/features/`.

**Tech Stack:** React Router 7, Zustand, date-fns, Conform/Zod (forms), DaisyUI 5, Tailwind CSS v4

---

### Task 1: Date utility functions

**Files:**
- Create: `frontend_rr7/app/lib/utils/dates.ts`

Port the essential date utilities from `frontend/src/lib/utils/date/dates.ts`:
- `formatISOLocale(d: Date): string` — ISO format with timezone offset (required by backend)
- `getWeekOfDate(date): string[]` — array of ISO date strings for the week (Monday start)
- `getMonthOfDate(date): string[]` — array for the month

Also port the `apiTimespanWeek`/`apiTimespanMonth` helpers from `frontend/src/lib/api/apiDateHandling.ts` — needed by CalendarDataProvider for fetcher params.

Reference: `frontend/src/lib/utils/date/dates.ts:55-104`, `frontend/src/lib/api/apiDateHandling.ts`

**Verify:** `yarn check`

**Commit:** `feat: add date utility functions for calendar`

---

### Task 2: Calendar Zustand store

**Files:**
- Create: `frontend_rr7/app/features/calendar/calendar-store.ts`

1:1 port of `frontend/src/stores/calendarStore.ts`. Same interface:
- State: `selectedDate`, `previousDate`, `viewMode`
- Actions: `setSelectedDate`, `setViewMode`, `goToToday`, `goToNext/PreviousDay/Week/Month`, `resetCalendar`
- Middleware: `devtools` → `persist` → `subscribeWithSelector` → `immer`
- Persist config: `name: 'lasius-calendar-store'`, partialize `selectedDate` + `viewMode`
- Export selector hooks: `useSelectedDate`, `usePreviousDate`, `useCalendarViewMode`
- Export action hook: `useCalendarActions`
- Export `subscribeToDateChanges`

Use `formatISOLocale` from Task 1 instead of the old import path.

Reference: `frontend/src/stores/calendarStore.ts` (full file)

**Verify:** `yarn check`

**Commit:** `feat: add calendar Zustand store`

---

### Task 3: Calendar hooks

**Files:**
- Create: `frontend_rr7/app/features/calendar/hooks/use-calendar-navigation.ts`
- Create: `frontend_rr7/app/features/calendar/hooks/use-calendar-selection.ts`

Port from `frontend/src/components/features/calendar/hooks/`:

**use-calendar-navigation.ts** — `useCalendarNavigation(initialDate, viewType: 'week' | 'month')`:
- Returns `{ period: string[], next, previous, goToDate }`
- Uses `getWeekOfDate`/`getMonthOfDate` from Task 1
- Updates calendar store `setSelectedDate` on next/previous

**use-calendar-selection.ts** — `useCalendarSelection(initialDate, useStore = true)`:
- Returns `{ selectedDay, selectDay, selectToday, isDaySelected }`
- Syncs with calendar store when `useStore = true`
- `isDaySelected` compares day numbers

Reference: `frontend/src/components/features/calendar/hooks/useCalendarNavigation.ts`, `useCalendarSelection.ts`

**Verify:** `yarn check`

**Commit:** `feat: add calendar navigation and selection hooks`

---

### Task 4: Resource route for calendar bookings

**Files:**
- Create: `frontend_rr7/app/routes/api.calendar-bookings.ts`
- Modify: `frontend_rr7/app/routes.ts` — add route

Resource route loader that fetches booking data for a date range:

```typescript
// GET /api/calendar-bookings?orgId=xxx&from=xxx&to=xxx
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await requireUser(request)
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!orgId || !from || !to) {
    return data({ bookings: [] }, { status: 400, headers: mergeAuthHeaders(auth) })
  }

  const result = await getUserBookingListByOrganisation(orgId, { from, to }, {
    headers: authHeaders(auth.session),
  })

  return data({ bookings: result.data }, { headers: mergeAuthHeaders(auth) })
}
```

Add to `routes.ts`:
```typescript
route('api/calendar-bookings', 'routes/api.calendar-bookings.ts'),
```

Reference: `frontend_rr7/app/services/api/lasius/user-bookings/user-bookings.ts` for the API function signature

**Verify:** `yarn check`

**Commit:** `feat: add calendar bookings resource route`

---

### Task 5: CalendarDataProvider (fetcher-based)

**Files:**
- Create: `frontend_rr7/app/features/calendar/calendar-data-provider.tsx`
- Create: `frontend_rr7/app/features/calendar/hooks/use-calendar-day-summary.ts`

Port `CalendarDataProvider` but replace SWR with `useFetcher`:

```typescript
export const CalendarDataProvider: React.FC<{
  children: React.ReactNode
  date: string
  period: 'week' | 'month'
  organisationId: string
}> = ({ children, date, period, organisationId }) => {
  const fetcher = useFetcher()

  const timespan = useMemo(() =>
    period === 'week' ? apiTimespanWeek(date) : apiTimespanMonth(date),
    [date, period])

  useEffect(() => {
    if (organisationId && date) {
      fetcher.load(`/api/calendar-bookings?orgId=${organisationId}&from=${timespan.from}&to=${timespan.to}`)
    }
  }, [organisationId, timespan.from, timespan.to])

  // Provide via context...
}
```

**use-calendar-day-summary.ts** — reads from context, filters bookings for specific day, computes progress percentage. Port from original but simplify (skip `useGetPlannedWorkingHoursByDate` for now — use a fixed 8h default or skip progress bars in first pass).

Reference: `frontend/src/components/features/calendar/CalendarDataProvider.tsx`, `hooks/useCalendarDaySummary.ts`

**Verify:** `yarn check`

**Commit:** `feat: add calendar data provider with fetcher`

---

### Task 6: UI primitive components needed by calendar

**Files:**
- Create: `frontend_rr7/app/components/ui/data-display/format-date.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/progress-bar-small.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/dots/dot-red.tsx`

**format-date.tsx** — renders formatted dates using `date-fns/format` + `useTranslation` locale. Supports formats: `dayNameShort`, `dayPadded`, `monthNameLong`, `year`. Check original `frontend/src/lib/utils/date/dateFormat.ts` for the format map.

**progress-bar-small.tsx** — small horizontal progress bar shown under calendar days. Port from `frontend/src/components/ui/data-display/ProgressBarSmall.tsx`.

**dot-red.tsx** — red dot indicator for "today". Port from `frontend/src/components/ui/data-display/dots/dotRed.tsx`.

Reference: check originals for exact class names and markup

**Verify:** `yarn check`

**Commit:** `feat: add date display and progress UI primitives`

---

### Task 7: CalendarDay component

**Files:**
- Create: `frontend_rr7/app/features/calendar/components/calendar-day.tsx`

1:1 port of `frontend/src/components/features/calendar/calendarDay.tsx`:
- Props: `date: string`, `onClick`, `isSelected`
- Shows: day name (short), day number (padded), progress bar (from context), red dot (if today)
- Styling: `btn btn-ghost`, weekend opacity, selected state
- Uses `useCalendarDaySummary` from Task 5
- Uses `FormatDate` from Task 6

Match class names exactly from original.

Reference: `frontend/src/components/features/calendar/calendarDay.tsx`

**Verify:** `yarn check`

**Commit:** `feat: add CalendarDay component`

---

### Task 8: CalendarWeek component

**Files:**
- Create: `frontend_rr7/app/features/calendar/components/calendar-week.tsx`

1:1 port of `frontend/src/components/ui/calendar/CalendarWeekResponsive.tsx`:
- Uses `useCalendarNavigation` (week), `useCalendarSelection` (store mode)
- Wrapped in `CalendarDataProvider`
- Layout: prev arrow | month/today/year header + 7-day grid | next arrow
- Grid: `grid-cols-[repeat(7,62px)]` mobile, `md:grid-cols-[repeat(7,1fr)]` desktop
- Skip `AnimateChange` and `SlidingIndicator` for now (add in follow-up) — note this in a TODO comment

For arrow buttons, create simple `ButtonLeft`/`ButtonRight` components using lucide `ChevronLeft`/`ChevronRight` with the existing `Button` component.

Reference: `frontend/src/components/ui/calendar/CalendarWeekResponsive.tsx`

**Verify:** `yarn check`

**Commit:** `feat: add CalendarWeek component`

---

### Task 9: Layout loader — fetch user profile + orgs

**Files:**
- Modify: `frontend_rr7/app/routes/app-layout.tsx` — expand loader

Expand the layout loader to fetch the full user profile (which includes organisations and settings):

```typescript
export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const profile = await getUserProfile({
    headers: authHeaders(auth.session),
  })
  return data(
    { user: profile.data },
    { headers: mergeAuthHeaders(auth) },
  )
}
```

The `ModelsUser` type from Orval includes `organisations: ModelsUserOrganisation[]` and `settings: ModelsUserSettings`.

Reference: `frontend_rr7/app/services/api/lasius/user/user.ts` for `getUserProfile`

**Verify:** `yarn check`

**Commit:** `feat: expand layout loader with full user profile`

---

### Task 10: Organisation switcher resource route

**Files:**
- Create: `frontend_rr7/app/routes/api.org-switch.ts`
- Modify: `frontend_rr7/app/routes.ts` — add route

```typescript
// POST /api/org-switch
export async function action({ request }: Route.ActionArgs) {
  const auth = await requireUser(request)
  const formData = await request.formData()
  const orgId = formData.get('organisationId') as string
  const orgKey = formData.get('organisationKey') as string

  const result = await updateUserSettings({
    lastSelectedOrganisation: { id: orgId, key: orgKey },
  }, { headers: authHeaders(auth.session) })

  return data({ user: result.data }, { headers: mergeAuthHeaders(auth) })
}
```

**Verify:** `yarn check`

**Commit:** `feat: add org switch resource route`

---

### Task 11: useOrganisation hook

**Files:**
- Create: `frontend_rr7/app/features/organisation/hooks/use-organisation.ts`

Hook that reads org data from the layout loader and provides selection logic:

```typescript
export const useOrganisation = () => {
  const loaderData = useRouteLoaderData('routes/app-layout') // needs route ID
  const user = loaderData?.user as ModelsUser
  const organisations = user?.organisations ?? []
  const settings = user?.settings

  // Derive selected org from settings.lastSelectedOrganisation or fallback
  const selectedOrganisationId = settings?.lastSelectedOrganisation?.id
    ?? organisations.find(o => o.private)?.organisationReference.id
    ?? organisations[0]?.organisationReference.id
    ?? ''

  const selectedOrganisation = organisations.find(
    o => o.organisationReference.id === selectedOrganisationId
  )

  // ... return selectedOrganisationId, selectedOrganisationKey, organisations, etc.
}
```

No Zustand store. Org data comes from loader, switching goes through fetcher action.

Reference: `frontend/src/lib/api/hooks/useOrganisation.tsx` for the interface

**Verify:** `yarn check`

**Commit:** `feat: add useOrganisation hook reading from layout loader`

---

### Task 12: Organisation switcher components

**Files:**
- Create: `frontend_rr7/app/features/organisation/components/org-switcher.tsx`
- Create: `frontend_rr7/app/features/organisation/components/org-switcher-modal.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/avatar/avatar-organisation.tsx`
- Create: `frontend_rr7/app/components/ui/cards/card-small.tsx`
- Create: `frontend_rr7/app/components/ui/overlays/modal.tsx`

**org-switcher.tsx** — 1:1 port of `selectUserOrganisation.tsx`:
- Ghost button with org avatar + name (hidden on mobile: `hidden md:flex`)
- Opens modal on click
- Uses `useOrganisation` from Task 11

**org-switcher-modal.tsx** — 1:1 port of `selectUserOrganisationModal.tsx`:
- 3-column grid of org cards with checkmark on selected
- On select: fetcher POST to `/api/org-switch`, close modal
- Uses `useOrganisation` + `useFetcher` + `useRevalidator`

**Supporting UI components** — port from originals:
- `avatar-organisation.tsx` — generates coloured avatar from org name
- `card-small.tsx` — small clickable card
- `modal.tsx` — DaisyUI modal wrapper (dialog element)

Reference: `frontend/src/components/features/user/selectUserOrganisation.tsx`, `selectUserOrganisationModal.tsx`

**Verify:** `yarn check`

**Commit:** `feat: add organisation switcher components`

---

### Task 13: Wire header in app-layout

**Files:**
- Modify: `frontend_rr7/app/routes/app-layout.tsx`

Replace placeholder comments with real components:

**Desktop header center:** `<CalendarWeek />` (always show calendar for now — route-aware switching comes later when BookingCurrent is ported)

**Desktop header right:** `<OrgSwitcher />` before the logout button

**Mobile header:** Add `<CalendarWeek />` between logo and logout (simplified)

Add org sync on mount: the layout component should call a sync effect to ensure the org store (if needed) or the `useOrganisation` hook correctly reflects the loader data.

Wire `CalendarDataProvider` at the layout level wrapping the header center, passing `organisationId` from `useOrganisation`.

Reference: `frontend/src/components/ui/layouts/headerDesktop.tsx` for layout structure

**Verify:** `yarn check`, then manually verify at `http://localhost:3000` that:
- Calendar week shows with 7 day pills
- Day selection works (click a day, it highlights)
- Week navigation works (prev/next arrows)
- Today button appears when not on today
- Org switcher shows org name, opens modal, switching works
- Layout matches original 1:1

**Commit:** `feat: wire calendar and org switcher into app layout header`

---

### Task 14: Update route config

**Files:**
- Modify: `frontend_rr7/app/routes.ts`

Ensure all new resource routes are registered:
```typescript
route('api/calendar-bookings', 'routes/api.calendar-bookings.ts'),
route('api/org-switch', 'routes/api.org-switch.ts'),
```

Already partially done in Tasks 4 and 10 — this is the final verification pass.

**Verify:** `yarn check` + `yarn build` (full build to catch any SSR issues)

**Commit:** `feat: register all new resource routes`
