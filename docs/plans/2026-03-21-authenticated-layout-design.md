# Authenticated Layout + Header Features Design

## Architecture

Nested outlets with a shared layout loader.

```
routes/
  app-layout.tsx              ← loader: user profile, orgs, settings
    dashboard.tsx             ← child route (Outlet)
    user.bookings.tsx         ← child route (Outlet)
    api.calendar-bookings.ts  ← resource route for calendar booking data
    api.org-switch.ts         ← resource route for org switching
```

## Data Strategy

### Server data (loader + fetcher actions)

- **Layout loader**: fetches user profile, organisations, user settings (SSR)
- **Org switching**: fetcher POST to `api.org-switch` action → updates backend settings → revalidates layout loader. Optimistic UI via `useFetcher` state.
- **Calendar bookings**: fetcher GET to `api.calendar-bookings?from=&to=&orgId=` → returns booking data for the date range. Called from CalendarDataProvider when date/org changes.

### Client state (Zustand)

- **Calendar store**: `selectedDate` (ISO string), `viewMode` ('day' | 'week' | 'month'), navigation actions (goToNext/PreviousWeek, goToToday, etc.). Persisted to localStorage.

### Rule: no direct backend calls from components

All backend communication goes through resource route loaders/actions via `useFetcher`. Feature components never import API functions directly.

## Feature Components

### `app/features/calendar/`

```
features/calendar/
  components/
    calendar-week.tsx           ← responsive week view (7 day pills)
    calendar-day.tsx            ← single day: name, number, progress bar
    calendar-navigation.tsx     ← prev/next week arrows
  hooks/
    use-calendar-navigation.ts  ← week period calculation, next/prev
    use-calendar-selection.ts   ← day selection logic
  calendar-data-provider.tsx    ← fetcher to api.calendar-bookings, provides context
  calendar-store.ts             ← Zustand store (date, viewMode, actions)
```

**Data flow:**
1. Zustand store holds selectedDate + viewMode
2. CalendarDataProvider watches store, calls `api.calendar-bookings` via fetcher when date/org changes
3. CalendarDay reads booking summary from context (not individual fetches)
4. Day clicks update Zustand store → triggers CalendarDataProvider refetch

### `app/features/organisation/`

```
features/organisation/
  components/
    org-switcher.tsx            ← button showing current org → opens modal
    org-switcher-modal.tsx      ← list of orgs, click to switch
  hooks/
    use-organisation.ts         ← reads layout loader data, derives selected org
```

**Data flow:**
1. `useOrganisation` reads orgs + settings from layout loader via `useRouteLoaderData`
2. Org switch → fetcher POST to `api.org-switch` with new orgId
3. Optimistic update via fetcher.state, layout loader revalidates
4. CalendarDataProvider re-fetches for new org

## Header

```
features/header/
  header-desktop.tsx    ← 3-column: Logo | CalendarWeek | OrgSwitcher + Help + Logout
  header-mobile.tsx     ← simplified single column
```

- Center column is route-aware: CalendarWeek on user routes, BookingCurrent elsewhere
- Responsive: `hidden md:grid` / `md:hidden` pattern

## Resource Routes

### `api.calendar-bookings.ts`

- **Method**: GET (loader)
- **Params**: `from`, `to`, `orgId` (search params)
- **Returns**: booking list for the date range
- **Auth**: `requireUser(request)`

### `api.org-switch.ts`

- **Method**: POST (action)
- **Body**: `{ organisationId }`
- **Effect**: updates user settings via backend API
- **Returns**: updated settings
- **Auth**: `requireUser(request)`
