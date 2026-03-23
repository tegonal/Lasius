# User/Lists & Organisation/Lists Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the booking history listing pages (user/lists + organisation/lists) from Next.js to React Router 7 as a 1:1 replica.

**Architecture:** Two route files share a `BookingHistoryLayout` feature component tree. Data loads via RR7 route loaders (replacing SWR hooks). Client-side filtering stays as pure computation. Form state via react-hook-form FormProvider.

**Tech Stack:** React Router 7, react-hook-form, date-fns, es-toolkit, xlsx (SheetJS CDN), DaisyUI 5, Tailwind CSS v4, i18next

**Constraints:**
- `motion/react` is blacklisted — do not install or use. AnimateNumber must use plain React (requestAnimationFrame or CSS transitions).
- `xlsx` must be installed from SheetJS CDN tarball (same version as Next.js frontend): `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`

---

## Pre-requisites

Missing npm packages must be installed first. The plan assumes `cd frontend_rr7` before all commands.

---

### Task 1: Install missing dependencies

**Files:**
- Modify: `frontend_rr7/package.json`

**Step 1: Install packages**

Run:
```bash
cd frontend_rr7
yarn add es-toolkit "xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

**Note:** Do NOT install `motion` or `motion/react` — it is blacklisted in this project.

**Step 2: Verify installation**

Run: `yarn check`

**Step 3: Commit**

```bash
git add frontend_rr7/package.json frontend_rr7/yarn.lock
git commit -m "feat: add es-toolkit, xlsx, and motion dependencies for booking history"
```

---

### Task 2: Create shared utility functions (pure, no UI)

These are small pure functions that can be copied almost verbatim from the original frontend.

**Files:**
- Create: `frontend_rr7/app/lib/api/functions/filter-models-booking-list-by-tags.ts`
- Create: `frontend_rr7/app/lib/api/functions/filter-models-booking-list-project-id.ts`
- Create: `frontend_rr7/app/lib/api/functions/filter-models-booking-list-user-id.ts`
- Create: `frontend_rr7/app/lib/api/functions/get-models-booking-summary.ts`
- Create: `frontend_rr7/app/lib/api/functions/sort-bookings-by-date.ts`
- Create: `frontend_rr7/app/lib/api/functions/api-date-handling.ts`
- Create: `frontend_rr7/app/lib/utils/date/date-options.ts`
- Create: `frontend_rr7/app/lib/utils/data/export.ts`
- Create: `frontend_rr7/app/lib/utils/data/count-decimals.ts`
- Create: `frontend_rr7/app/types/booking.ts`
- Create: `frontend_rr7/app/types/common.ts`

**Implementation notes:**

Each file is a near-copy of the original with import path adjustments:
- `lib/api/lasius` → `~/services/api/lasius`
- `lib/utils/date/dates` → `~/lib/utils/dates`
- `types/booking` → `~/types/booking`
- `types/common` → `~/types/common`
- `lib/utils/string/strings` → `~/lib/utils/strings`
- `es-toolkit` stays as `es-toolkit`

**Step 1: Create types**

`frontend_rr7/app/types/booking.ts`:
```typescript
import { type ModelsBooking } from '~/services/api/lasius'

export type ExtendedHistoryBooking = ModelsBooking & {
  date: string
  fromTo: string
  duration: number
  durationString: string
}

export type UserBookingSource = 'tag' | 'project'
export type OrganisationBookingSource = 'tag' | 'project' | 'user'
export type OrganisationPieChartSource = 'project' | 'user'
```

`frontend_rr7/app/types/common.ts`:
```typescript
import { type ModelsTag, type ModelsWorkingHours } from '~/services/api/lasius'

export type NivoChartDataType = Array<{ [x: string]: string | number }>
export type ModelsWorkingHoursWeekdays = keyof ModelsWorkingHours
export type ModelsTags = ModelsTag
export type ModelsTagWithSummary = ModelsTag & { summary?: string }
export type Granularity = 'All' | 'Year' | 'Month' | 'Week' | 'Day'
```

**Step 2: Create filter functions**

`frontend_rr7/app/lib/api/functions/filter-models-booking-list-by-tags.ts`:
```typescript
import { difference } from 'es-toolkit'

import { cleanStrForCmp } from '~/lib/utils/strings'
import { type ModelsBooking } from '~/services/api/lasius'
import { type ModelsTags } from '~/types/common'

export const filterModelsBookingListByTags = (list: ModelsBooking[], tags: ModelsTags[]) =>
  list.filter((booking) => {
    const arrFilter = tags.map((item) => cleanStrForCmp(item.id))
    const arrBooking = booking.tags.map((item) => cleanStrForCmp(item.id))
    return difference(arrFilter, arrBooking).length === 0
  })
```

`frontend_rr7/app/lib/api/functions/filter-models-booking-list-project-id.ts`:
```typescript
import { type ModelsBooking } from '~/services/api/lasius'

export const filterModelsBookingListProjectId = (list: ModelsBooking[], projectId: string) =>
  list.filter((booking) => (projectId ? booking.projectReference.id === projectId : true))
```

`frontend_rr7/app/lib/api/functions/filter-models-booking-list-user-id.ts`:
```typescript
import { type ModelsBooking } from '~/services/api/lasius'

export const filterModelsBookingListUserId = (list: ModelsBooking[], userId: string) =>
  list.filter((booking) => (userId ? booking.userReference.id === userId : true))
```

**Step 3: Create summary and sort functions**

`frontend_rr7/app/lib/api/functions/get-models-booking-summary.ts`:
```typescript
import { round } from 'es-toolkit'

import { getExtendedModelsBookingList } from '~/lib/api/functions/get-extended-models-booking-list'
import { type ModelsBooking } from '~/services/api/lasius'

export const getModelsBookingSummary = (list: ModelsBooking[]) => {
  const hours = round(
    getExtendedModelsBookingList(list).reduce((acc, item) => acc + item.duration, 0),
    2,
  )
  const elements = list.length
  return { hours, elements }
}
```

`frontend_rr7/app/lib/api/functions/sort-bookings-by-date.ts`:
```typescript
import { orderBy } from 'es-toolkit'

import { type ModelsBooking } from '~/services/api/lasius'
import { type ExtendedHistoryBooking } from '~/types/booking'

export const sortBookingsByDate = (bookings: ModelsBooking[]) => {
  if (bookings.length === 0) return []
  return orderBy(bookings, [(data) => data.start.dateTime], ['desc'])
}

export const sortExtendedBookingsByDate = (bookings: ExtendedHistoryBooking[]) => {
  if (bookings.length === 0) return []
  return orderBy(bookings, [(data) => data.date], ['desc'])
}
```

**Step 4: Create api-date-handling**

`frontend_rr7/app/lib/api/functions/api-date-handling.ts`:
Copy the full content of `frontend/src/lib/api/apiDateHandling.ts` with adjusted imports:
- `date-fns` imports stay the same
- `date-fns-tz` imports stay the same
- `lib/api/lasius` → `~/services/api/lasius`
- `types/common` → `~/types/common`

**Step 5: Create date-options**

`frontend_rr7/app/lib/utils/date/date-options.ts`:
Copy `frontend/src/lib/utils/date/dateOptions.ts` with:
- `lib/utils/date/dates` → `~/lib/utils/dates` (for `formatISOLocale`)

**Step 6: Create count-decimals utility**

`frontend_rr7/app/lib/utils/data/count-decimals.ts`:
Read original at `frontend/src/lib/utils/data/countDecimals.ts` and copy with adjusted imports.

**Step 7: Create export utility**

`frontend_rr7/app/lib/utils/data/export.ts`:
Copy `frontend/src/lib/utils/data/export.ts` with:
- `lib/api/apiDateHandling` → `~/lib/api/functions/api-date-handling`
- `types/booking` → `~/types/booking`

**Step 8: Run checks**

Run: `yarn check`

**Step 9: Commit**

```bash
git add frontend_rr7/app/lib/api/functions/ frontend_rr7/app/lib/utils/ frontend_rr7/app/types/
git commit -m "feat: add booking history utility functions and types"
```

---

### Task 3: Create shared UI components (DataList, Stats, etc.)

**Files:**
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list-row.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list-field.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list-header-item.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/stats-group.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/stats-tile-wrapper.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/stats-tile-hours.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/stats-tile-number.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/loading.tsx`
- Create: `frontend_rr7/app/components/ui/animations/animate-number.tsx`
- Create: `frontend_rr7/app/components/ui/layouts/column-list.tsx`

**Implementation notes:**

These are direct ports of the original components. Key adaptations:
- `cn` import: `lib/utils/cn` → `~/lib/utils/cn`
- `Heading` component in `DataListHeaderItem`: The original uses `<Heading variant="headingTableHeader">`. Since no `Heading` component exists in RR7 yet, inline the styling: `<span className="text-xs font-medium uppercase tracking-wider">`
- `AnimateNumber`: Uses `motion/react` for animation, `es-toolkit/compat` for `round`/`padStart`
- `StatsTileHours`: Uses `useUIStore` from Zustand. Create a minimal UI store or simplify — the original toggles between decimal and HH:MM display. Port the Zustand store pattern.
- `countDecimals`: Import from `~/lib/utils/data/count-decimals`

**Step 1: Create DataList components**

Port all 4 DataList files. They are simple wrappers:

`data-list.tsx`: `<table className="w-full border-collapse"><tbody>{children}</tbody></table>`

`data-list-row.tsx`: `<tr className="border-base-content/20 border-b [&>td:first-child]:pl-4 [&>td:last-child]:w-12 [&>td:last-child]:pr-2">{children}</tr>`

`data-list-field.tsx`: `<td>` with optional width prop and `cn('p-1 py-3', className)`

`data-list-header-item.tsx`: `<td>` with inline header styling (no Heading component dependency)

**Step 2: Create AnimateNumber**

Rewrite `frontend/src/components/ui/animations/motion/animateNumber.tsx` WITHOUT `motion/react` (blacklisted).
Use `requestAnimationFrame` for number animation instead:
- `es-toolkit/compat` → `es-toolkit/compat` (same)
- `lib/utils/data/countDecimals` → `~/lib/utils/data/count-decimals`
- Replace `animate()` from motion with a `requestAnimationFrame` loop that lerps from → to over ~330ms

**Step 3: Create UI store for stats tile toggle**

Create `frontend_rr7/app/stores/ui-store.ts`:
```typescript
import { create } from 'zustand'

type UIState = {
  statsTileTimeAsDecimals: boolean
  toggleStatsTileTimeAsDecimals: () => void
}

export const useUIStore = create<UIState>((set) => ({
  statsTileTimeAsDecimals: false,
  toggleStatsTileTimeAsDecimals: () =>
    set((state) => ({ statsTileTimeAsDecimals: !state.statsTileTimeAsDecimals })),
}))

export const useStatsTileTimeAsDecimals = () =>
  useUIStore((state) => state.statsTileTimeAsDecimals)
```

**Step 4: Create Stats components**

Port StatsGroup, StatsTileWrapper, StatsTileHours, StatsTileNumber with:
- `components/ui/animations/motion/animateNumber` → `~/components/ui/animations/animate-number`
- `components/ui/data-display/StatsTileWrapper` → `~/components/ui/data-display/stats-tile-wrapper`
- `stores/uiStore` → `~/stores/ui-store`
- `lib/utils/date/dates` → `~/lib/utils/dates` (for `decimalHoursToObject`)

**Step 5: Create Loading and ColumnList**

`loading.tsx`:
```typescript
export const Loading = () => (
  <div className="flex w-full items-center justify-center p-8">
    <span className="loading loading-spinner loading-md" />
  </div>
)
```

`column-list.tsx`:
```typescript
export const ColumnList = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full flex-col gap-4 px-6 pt-3 pb-4">{children}</div>
)
```

**Step 6: Run checks**

Run: `yarn check`

**Step 7: Commit**

```bash
git add frontend_rr7/app/components/ui/ frontend_rr7/app/stores/
git commit -m "feat: add DataList, Stats, AnimateNumber, Loading, and ColumnList UI components"
```

---

### Task 4: Create useScrollPagination hook

**Files:**
- Create: `frontend_rr7/app/hooks/use-scroll-pagination.ts`

**Step 1: Port the hook**

Direct copy of `frontend/src/lib/hooks/useScrollPaginationHook.tsx` with:
- No import changes needed (only uses React)
- Convert to arrow function style
- Export as named export

```typescript
import { type UIEvent, useEffect, useState } from 'react'

interface UseScrollPagination<E> {
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  visibleElements: E[]
}

export const useScrollPagination = <E,>(
  elements: E[],
  showItemsPerStep = 30,
  scrollBeforeEnd = 50,
): UseScrollPagination<E> => {
  const [shownNumberOfItems, setShownNumberOfItems] = useState(showItemsPerStep)

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!event.target) return
    const { scrollHeight, scrollTop, clientHeight } = event.target as HTMLDivElement
    const scroll = scrollHeight - scrollTop - clientHeight

    if (scroll < scrollBeforeEnd && elements.length > shownNumberOfItems) {
      const newNumberOfItems = Math.min(shownNumberOfItems + showItemsPerStep, elements.length)
      if (newNumberOfItems > shownNumberOfItems) {
        setShownNumberOfItems(newNumberOfItems)
      }
    }
  }

  useEffect(() => {
    setShownNumberOfItems(showItemsPerStep)
  }, [elements.length, showItemsPerStep])

  return { onScroll, visibleElements: elements.slice(0, shownNumberOfItems) }
}
```

**Step 2: Run checks**

Run: `yarn check`

**Step 3: Commit**

```bash
git add frontend_rr7/app/hooks/use-scroll-pagination.ts
git commit -m "feat: add useScrollPagination hook"
```

---

### Task 5: Create form select components (ProjectSelect, UserSelect, TagSelect, DateRangeFilter)

**Files:**
- Create: `frontend_rr7/app/components/ui/forms/select/project-select.tsx`
- Create: `frontend_rr7/app/components/ui/forms/select/user-select.tsx`
- Create: `frontend_rr7/app/components/ui/forms/select/date-range-filter.tsx`

**Implementation notes:**

Read the originals first:
- `frontend/src/components/ui/forms/input/ProjectSelect.tsx`
- `frontend/src/components/ui/forms/input/UserSelect.tsx`
- `frontend/src/components/ui/forms/DateRangeFilter.tsx`

Port them with:
- `next-i18next` → `react-i18next`
- `useRouter` → `useSearchParams` (for reading URL params)
- SWR hooks for project/user lists → read from loader data via `useRouteLoaderData` or direct API calls
- `useOrganisation` → `~/features/organisation/hooks/use-organisation`
- Form integration stays the same (react-hook-form `useFormContext`)

**TagSelect** is likely `InputTagsAutocomplete` which already exists in RR7 at `frontend_rr7/app/components/ui/forms/input/input-tags-autocomplete.tsx`. Check if the filter uses it directly or through a wrapper.

**Step 1: Read original form components**

Read the originals to understand exact behavior before porting.

**Step 2: Create ProjectSelect**

Must list all projects for the current organisation. Read from the app-layout loader data or use a dedicated API call.

**Step 3: Create UserSelect**

Must list all users in the current organisation (only shown for org admin in organisationBookings mode).

**Step 4: Create DateRangeFilter**

Uses the `dateOptions` array to provide preset date ranges plus a custom date picker.

**Step 5: Run checks**

Run: `yarn check`

**Step 6: Commit**

```bash
git add frontend_rr7/app/components/ui/forms/select/
git commit -m "feat: add ProjectSelect, UserSelect, and DateRangeFilter form components"
```

---

### Task 6: Create BookingHistory feature components

**Files:**
- Create: `frontend_rr7/app/features/booking-history/components/booking-history-stats.tsx`
- Create: `frontend_rr7/app/features/booking-history/components/booking-history-export.tsx`
- Create: `frontend_rr7/app/features/booking-history/components/booking-history-item-context.tsx`
- Create: `frontend_rr7/app/features/booking-history/components/booking-history-table.tsx`
- Create: `frontend_rr7/app/features/booking-history/components/booking-history-filter.tsx`
- Create: `frontend_rr7/app/features/booking-history/components/booking-history-layout.tsx`
- Create: `frontend_rr7/app/features/booking-history/components/empty-state-booking-history.tsx`

**Implementation notes:**

Port order matters — start with leaf components (no feature dependencies), work up to the layout.

**Step 1: Create BookingHistoryStats**

Port from original. Key changes:
- `components/ui/data-display/StatsGroup` → `~/components/ui/data-display/stats-group`
- `components/ui/data-display/StatsTileHours` → `~/components/ui/data-display/stats-tile-hours`
- `components/ui/data-display/StatsTileNumber` → `~/components/ui/data-display/stats-tile-number`
- `next-i18next` → `react-i18next`

**Step 2: Create BookingHistoryExport**

Port from original. Key changes:
- `components/ui/feedback/hooks/useToast` → `~/components/ui/feedback/use-toast`
- `lib/utils/data/export` → `~/lib/utils/data/export`
- `next-i18next` → `react-i18next`

**Step 3: Create EmptyStateBookingHistory**

Read original at `frontend/src/components/ui/data-display/EmptyStateBookingHistory.tsx` and port.

**Step 4: Create BookingHistoryItemContext**

Port from original. Key changes:
- `components/features/contextMenu/hooks/useContextMenu` → `~/components/features/context-menu/hooks/use-context-menu`
- `components/features/user/index/bookingAddUpdateForm` → `~/features/bookings/components/booking-add-update-form`
- `lib/api/hooks/useOrganisation` → `~/features/organisation/hooks/use-organisation`
- `lib/api/lasius/user-bookings/user-bookings` (deleteUserBooking) → `~/services/api/lasius/user-bookings/user-bookings`
- `AnimatePresence` from `motion/react` → replace with CSS transitions or conditional rendering (motion is blacklisted)

**Step 5: Create BookingHistoryTable**

Port from original. Key changes:
- DataList components → `~/components/ui/data-display/data-list/`
- `lib/api/functions/sortBookingsByDate` → `~/lib/api/functions/sort-bookings-by-date`
- `types/booking` → `~/types/booking`
- `types/common` → `~/types/common`
- `next-i18next` → `react-i18next`

**Step 6: Create BookingHistoryFilter**

Port from original. Key changes:
- Form select components → `~/components/ui/forms/select/`
- `lib/api/hooks/useOrganisation` → `~/features/organisation/hooks/use-organisation`
- `lib/api/lasius/user-organisations/user-organisations` → `~/services/api/lasius/user-organisations/user-organisations`
- `lib/utils/date/dateOptions` → `~/lib/utils/date/date-options`
- `next/router` (useRouter) → `react-router` (useSearchParams)
- `next-i18next` → `react-i18next`
- Tag autocomplete: check if `InputTagsAutocomplete` can be reused

**Step 7: Create BookingHistoryLayout**

This is the main container. Port from original with major architectural change:

Original: conditionally calls SWR hooks based on `dataSource` prop.
RR7: receives bookings data as a prop from the route loader. No SWR hooks inside.

```typescript
type Props = {
  bookings: ModelsBooking[]
  dataSource: 'userBookings' | 'organisationBookings'
}
```

The component keeps:
- FormProvider with react-hook-form
- Client-side filtering (filterByTags, filterByProjectId, filterByUserId)
- processedItems, summary, distinctUsers, distinctProjects memos
- useScrollPagination
- Layout with ScrollArea for table and filter sidebar

URL search param reading for `projectId` changes from `useRouter().query` to `useSearchParams()`.

**Step 8: Run checks**

Run: `yarn check`

**Step 9: Commit**

```bash
git add frontend_rr7/app/features/booking-history/
git commit -m "feat: add BookingHistory feature components"
```

---

### Task 7: Create route files (user.lists + organisation.lists)

**Files:**
- Create: `frontend_rr7/app/routes/user.lists.tsx`
- Create: `frontend_rr7/app/routes/organisation.lists.tsx`

**Step 1: Create user.lists route**

```typescript
import { data } from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { BookingHistoryLayout } from '~/features/booking-history/components/booking-history-layout'
import { apiTimespanFromTo } from '~/lib/api/functions/api-date-handling'
import { formatISOLocale } from '~/lib/utils/dates'
import { getUserBookingListByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.lists'

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

  // Read date range from search params (default: today)
  const url = new URL(request.url)
  const from = url.searchParams.get('from') || formatISOLocale(new Date())
  const to = url.searchParams.get('to') || formatISOLocale(new Date())

  const timespan = apiTimespanFromTo(from, to)
  const bookings = timespan
    ? await getUserBookingListByOrganisation(selectedOrgId, timespan, { headers })
    : { data: [] }

  return data(
    {
      bookings: bookings.data ?? [],
      selectedOrgId,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

const UserListsPage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className={innerGridClasses}>
      <ColumnCenter>
        <BookingHistoryLayout
          bookings={loaderData.bookings}
          dataSource="userBookings"
        />
      </ColumnCenter>
    </div>
  )
}

export default UserListsPage
```

**Note:** The exact layout structure (ColumnCenter/ColumnRight, whether a right sidebar exists) needs to match the original `LayoutResponsive`. Check how other user pages handle layout in RR7 — the dashboard uses `ColumnCenter` + `ColumnRight`.

**Step 2: Create organisation.lists route**

Same pattern but:
- Uses `getOrganisationBookingList` instead of `getUserBookingListByOrganisation`
- Loader checks admin role — throw `Response(401)` if not admin
- `dataSource="organisationBookings"`

```typescript
// In loader:
const selectedOrg = organisations.find(
  (o) => o.organisationReference.id === selectedOrgId,
)
const isAdmin = selectedOrg?.role === 'OrganisationAdministrator'
if (!isAdmin) {
  throw new Response('Unauthorized', { status: 401 })
}
```

**Step 3: Run checks**

Run: `yarn check`

**Step 4: Verify routes are accessible**

Check `react-router.config.ts` or routes config to ensure file-based routing picks up the new files.

**Step 5: Commit**

```bash
git add frontend_rr7/app/routes/user.lists.tsx frontend_rr7/app/routes/organisation.lists.tsx
git commit -m "feat: add user/lists and organisation/lists routes with loaders"
```

---

### Task 8: Wire navigation links

**Files:**
- Modify: navigation config files (check `frontend_rr7/app/features/navigation/` for sidebar links)

**Step 1: Find navigation config**

Search for where "home", "dashboard" links are defined in `frontend_rr7/app/features/navigation/`.

**Step 2: Add lists navigation items**

Add "Lists" link under user section and "Lists" under organisation section matching the original navigation structure.

**Step 3: Run checks**

Run: `yarn check`

**Step 4: Commit**

```bash
git add frontend_rr7/app/features/navigation/
git commit -m "feat: add navigation links for user/lists and organisation/lists"
```

---

### Task 9: Visual verification and polish

**Step 1: Manual testing**

- Navigate to user/lists page
- Verify stats tiles display correctly
- Verify date range filter works (select "This Week", "Last Month", etc.)
- Verify project filter works
- Verify tag filter works
- Verify table renders with correct columns
- Verify context menu (edit, delete, favorite, start)
- Verify export (CSV, XLSX, ODS)
- Verify scroll pagination loads more items
- Navigate to organisation/lists (as admin)
- Verify user filter appears
- Verify user column shows in table
- Verify non-admin gets 401

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: polish booking history pages after visual verification"
```

---

## Dependency Graph

```
Task 1 (deps) ─┬─> Task 2 (utils) ─┬─> Task 6 (feature components) ─> Task 7 (routes) ─> Task 8 (nav) ─> Task 9 (verify)
                │                    │
                ├─> Task 3 (UI)  ────┤
                │                    │
                └─> Task 4 (hook) ───┘
                     Task 5 (selects)┘
```

Tasks 2, 3, 4, 5 can run in parallel after Task 1.
Task 6 depends on Tasks 2, 3, 4, 5.
Tasks 7, 8, 9 are sequential.

## Key Risks

1. **Form select components (Task 5)** — ProjectSelect and UserSelect need data sources. In the original they use SWR hooks. In RR7 they may need to read from route loader data or use fetchers. Read the originals carefully before porting.
2. **Layout structure** — The original uses `LayoutResponsive` which renders a two-column layout. Verify the RR7 equivalent (likely `ColumnCenter` + `ColumnRight` or similar).
3. **Tag autocomplete** — Check if `InputTagsAutocomplete` in RR7 matches what the filter needs, or if a wrapper is required.
4. **Date range re-fetching** — When the user changes the date range, the loader needs to re-run. This requires updating URL search params, which triggers RR7 revalidation.
