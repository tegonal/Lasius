# User/Lists & Organisation/Lists Migration Design

## Goal

Migrate the booking history listing pages (`user/lists` and `organisation/lists`) from the Next.js frontend to React Router 7. Exact 1:1 replica of all user-facing behavior.

## Source Components (frontend/)

| File | Purpose |
|------|---------|
| `pages/user/lists.tsx` | User bookings list page |
| `pages/organisation/lists.tsx` | Organisation bookings list page (admin-gated) |
| `components/features/bookingHistory/bookingHistoryLayout.tsx` | Main container — form provider, data fetching, filtering |
| `components/features/bookingHistory/bookingHistoryFilter.tsx` | Sidebar filter (project, tags, date range, user) |
| `components/features/bookingHistory/bookingHistoryStats.tsx` | Stats tiles row (hours, bookings, users, projects) |
| `components/features/bookingHistory/bookingHistoryTable.tsx` | Data table with click-to-filter and context menus |
| `components/features/bookingHistory/bookingHistoryExport.tsx` | Export dropdown (CSV/XLSX/ODS) |
| `components/features/bookingHistory/bookingHistoryItemContext.tsx` | Row context menu (edit/delete/favorite/start) |

## Target Structure (frontend_rr7/)

### Routes

```
routes/
  user.lists.tsx              → loader: fetchUserBookings, renders BookingHistoryLayout
  organisation.lists.tsx      → loader: fetchOrgBookings (admin-gated), renders BookingHistoryLayout
```

### Feature Components

```
features/booking-history/
  components/
    booking-history-layout.tsx
    booking-history-filter.tsx
    booking-history-stats.tsx
    booking-history-table.tsx
    booking-history-export.tsx
    booking-history-item-context.tsx
```

### New Shared UI Components

```
components/ui/data-display/
  data-list/
    data-list.tsx
    data-list-row.tsx
    data-list-field.tsx
    data-list-header-item.tsx
  stats-group.tsx
  stats-tile-hours.tsx
  stats-tile-number.tsx
  loading.tsx
  empty-state-booking-history.tsx

components/ui/layouts/
  column-list.tsx
```

### New Form Components

```
components/ui/forms/
  select/
    project-select.tsx
    user-select.tsx
    tag-select.tsx
```

### New Utilities & Hooks

```
lib/api/functions/
  filter-models-booking-list-by-tags.ts
  filter-models-booking-list-project-id.ts
  filter-models-booking-list-user-id.ts
  get-extended-models-booking-list.ts
  get-models-booking-summary.ts
  sort-bookings-by-date.ts
  api-date-handling.ts

lib/utils/data/
  export.ts

hooks/
  use-scroll-pagination.ts
```

## Key Architectural Decisions

### SWR → Route Loaders

The original uses conditional SWR hooks (with eslint-disable comments). In RR7:
- Route loaders call Orval-generated API functions with date range params
- `useLoaderData()` provides initial booking data to BookingHistoryLayout
- Date range changes trigger re-fetch via `useFetcher()` or `useRevalidator()`
- Client-side filtering (project, tags, user) remains as pure computation on loaded data

### Organisation Lists — Admin Gating

Original checks `isAdminOfCurrentOrg` and shows Error(401). In RR7:
- Loader checks admin role and throws `Response(401)` if unauthorized
- Route error boundary renders the 401 UI

### Form State

- `react-hook-form` FormProvider wraps the layout (same as original)
- Filter form values drive client-side filtering via `watch()`
- URL search params for projectId preserved (deep linking from project pages)

### Scroll Pagination

- `useScrollPagination` hook migrated as-is — progressive rendering of large lists
- Attached to ScrollArea's onScroll event

## Existing Components to Reuse

- `ScrollArea` — already in RR7
- `Toast/useToast` — already in RR7
- `ContextMenu/useContextMenu` — already in RR7
- `BookingAddUpdateForm` — already in RR7
- Date utilities (`formatISOLocale`, `dateOptions`) — already in RR7
- Orval API client — already generated

## Dependencies

- `xlsx` package — needed for export (CSV/XLSX/ODS). Check if already in package.json.
- `lodash/orderBy` — for sorting. Check if already available.
