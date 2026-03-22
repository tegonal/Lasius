# Booking Edit Modal Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the booking add/update/edit-running modal system from Next.js to React Router 7, including all form input components.

**Architecture:** Copy-port the entire form component tree from `frontend/src/` to `frontend_rr7/app/`. Form inputs use Headless UI comboboxes + react-hook-form. Date picker uses a custom segmented input system with Zustand store. All form submissions go through `useFetcher` → `api.bookings.ts` resource route. Project and tag data is fetched via a new resource route (`api.booking-form-data.ts`) that the form loads via `useFetcher.load()`.

**Tech Stack:** React 19, react-hook-form, @headlessui/react, date-fns, Tailwind CSS 4 + DaisyUI 5, useFetcher (React Router 7)

---

## Dependency Tree

```
BookingItemContext (existing, wires modal open)
BookingCurrentEntryContext (existing, wires modal open)
  └── Modal (existing)
       ├── BookingAddUpdateForm (Task 7)
       │    ├── ProjectSelect (Task 4)
       │    │    └── InputSelectAutocomplete (Task 3)
       │    │         ├── DropdownList / DropdownListItem (Task 2)
       │    │         └── react-hook-form Controller
       │    ├── InputTagsAutocomplete (Task 5)
       │    │    ├── TagList / Tag (existing)
       │    │    └── DropdownList (Task 2)
       │    ├── InputDatePicker (Task 6)
       │    │    ├── SegmentedDateInputConnected
       │    │    ├── SegmentedTimeInputConnected
       │    │    ├── CalendarDisplay
       │    │    └── DatePickerStore (Zustand)
       │    ├── InputDatePickerDuration (Task 6)
       │    │    └── SegmentedDurationInputConnected
       │    └── BookingPresetSelector (Task 8)
       │         └── IconTabs (existing)
       └── BookingEditRunning (Task 9)
            ├── ProjectSelect (Task 4)
            ├── InputTagsAutocomplete (Task 5)
            └── InputDatePicker (Task 6)
```

## Build Order

Tasks are ordered bottom-up so each task can be verified independently.

---

### Task 1: Resource route for form data

Create `api.booking-form-data.ts` — a GET resource route that returns project list, favorites, recent bookings, org bookings, and tags-by-project. The form components load this via `useFetcher.load('/api/booking-form-data?orgId=X&projectId=Y')`.

**Files:**
- Create: `frontend_rr7/app/routes/api.booking-form-data.ts`
- Modify: `frontend_rr7/app/routes.ts` (register route)

**What it does:**
- `loader` function: requires auth, reads `orgId` and optional `projectId` from URL search params
- Fetches in parallel: user profile (for projects), favorites list, recent bookings (last 7 days), org bookings (last 7 days)
- If `projectId` provided, also fetches `getTagsByProject(orgId, projectId)`
- Returns `{ projects, favorites, recentBookings, orgBookings, projectTags }`
- Projects extracted from user profile matching the selected org, sorted by key

**API functions to use (all from orval-generated code):**
- `getUserProfile` → extract projects from `user.organisations[selectedOrg].projects`
- `getFavoriteBookingList(orgId)`
- `getUserBookingListByOrganisation(orgId, { from, to })` — last 7 days
- `getOrganisationBookingList(orgId, { from, to })` — last 7 days for team
- `getTagsByProject(orgId, projectId)` — conditional on projectId param

**Register in routes.ts:**
```typescript
route('booking-form-data', 'routes/api.booking-form-data.ts'),
```

**Step 1:** Create the route file with loader
**Step 2:** Register in routes.ts
**Step 3:** Verify with `yarn check`
**Step 4:** Commit: `feat: add booking form data resource route`

---

### Task 2: Dropdown list components

Port the dropdown list container and list item used by all autocomplete inputs.

**Files:**
- Create: `frontend_rr7/app/components/ui/forms/input/shared/dropdown-list.tsx`
- Create: `frontend_rr7/app/components/ui/forms/input/shared/dropdown-list-item.tsx`

**Source files:**
- `frontend/src/components/ui/forms/input/shared/dropdownList.tsx`
- `frontend/src/components/ui/forms/input/shared/dropdownListItem.tsx`

**Adaptation notes:**
- Rename to kebab-case files
- Update imports to RR7 paths (`~/components/...`)
- Keep Tailwind classes identical
- `DropdownListItem` highlights matching text — port the `cleanStrForCmp` util

**Also create:**
- `frontend_rr7/app/lib/utils/strings.ts` — port `cleanStrForCmp` from `frontend/src/lib/utils/string/strings.ts`

**Step 1:** Create string util
**Step 2:** Create dropdown-list.tsx
**Step 3:** Create dropdown-list-item.tsx
**Step 4:** Verify with `yarn check`
**Step 5:** Commit: `feat: add dropdown list components for autocomplete inputs`

---

### Task 3: InputSelectAutocomplete

Port the generic autocomplete select component using Headless UI Combobox.

**Files:**
- Create: `frontend_rr7/app/components/ui/forms/input/input-select-autocomplete.tsx`

**Source:** `frontend/src/components/ui/forms/input/InputSelectAutocomplete.tsx`

**Adaptation notes:**
- Uses `@headlessui/react` Combobox (already in package.json)
- Uses `react-hook-form` Controller (already in package.json)
- Uses `es-toolkit/compat` sortBy (check if available, otherwise use native sort)
- References `ModelsEntityReference` from orval types
- Uses `FormErrorBadge` (already exists in RR7)
- Port the `Alert` component if not existing, or use DaisyUI alert classes inline

**Step 1:** Check if `es-toolkit` is in RR7 package.json; if not, use native `.sort()`
**Step 2:** Create the component
**Step 3:** Verify with `yarn check`
**Step 4:** Commit: `feat: add InputSelectAutocomplete component`

---

### Task 4: ProjectSelect

Port the domain-specific project select wrapper.

**Files:**
- Create: `frontend_rr7/app/components/ui/forms/input/project-select.tsx`

**Source:** `frontend/src/components/ui/forms/input/ProjectSelect.tsx`

**Adaptation notes:**
- Original uses `useProjects()` hook which reads from SWR profile cache
- In RR7: read project list from parent form's `projects` prop or use a context/prop passed from the form
- The form will pass `projects` as a prop (loaded from `api.booking-form-data` route)
- ProjectSelect receives `projects: ModelsEntityReference[]` prop instead of using `useProjects()` hook
- Still uses `useFormContext()` to read/write the `projectId` field
- Keep the fallback project logic (inactive projects, unavailable projects)

**Step 1:** Create the component with projects prop
**Step 2:** Verify with `yarn check`
**Step 3:** Commit: `feat: add ProjectSelect form component`

---

### Task 5: InputTagsAutocomplete

Port the tag autocomplete with inline tag list display.

**Files:**
- Create: `frontend_rr7/app/components/ui/forms/input/input-tags-autocomplete.tsx`

**Source:** `frontend/src/components/ui/forms/input/InputTagsAutocomplete.tsx`

**Adaptation notes:**
- Uses `@headlessui/react` Combobox for multi-select
- Displays selected tags via existing `TagList` / `Tag` components (already in RR7)
- Uses `isImporterTag` from `~/lib/utils/tag-helpers` (already in RR7)
- Uses `react-hook-form` Controller
- Tags come as prop `suggestions` — loaded from parent form via `api.booking-form-data`
- Port `ModelsTags` / `ModelsTagWithSummary` types — check if they exist in orval types

**Step 1:** Check orval types for tag models
**Step 2:** Create the component
**Step 3:** Verify with `yarn check`
**Step 4:** Commit: `feat: add InputTagsAutocomplete component`

---

### Task 6: Date picker system

This is the largest task — the entire segmented date/time/duration input system. Port all ~15 files.

**Files to create (entire tree):**

```
frontend_rr7/app/components/ui/forms/input/date-picker/
  ├── store/
  │    └── use-date-picker-store.ts          (Zustand store)
  ├── shared/
  │    ├── core/
  │    │    ├── index.ts
  │    │    ├── segment-bounds.ts
  │    │    ├── segment-config.ts
  │    │    └── segment-selection.ts
  │    ├── input/
  │    │    ├── index.ts
  │    │    ├── input-change-handler.ts
  │    │    ├── input-validation.ts
  │    │    └── keyboard-handlers.ts
  │    ├── date-time-helpers.ts
  │    ├── duration-utils.ts
  │    ├── segment-utils.ts
  │    ├── segmented-input-wrapper.tsx
  │    └── use-segmented-input.ts
  ├── input-date-picker.tsx                  (main component)
  ├── input-date-picker-duration.tsx
  ├── segmented-date-input-connected.tsx
  ├── segmented-time-input-connected.tsx
  └── segmented-duration-input-connected.tsx
```

Also needed:
- `frontend_rr7/app/components/ui/forms/input/calendar/calendar-display.tsx` — the calendar popup

**Source directory:** `frontend/src/components/ui/forms/input/datePicker/`

**Adaptation notes:**
- Date picker store uses Zustand (`createStore`) — already available in RR7
- `SegmentedInputWrapper` is a pure UI component — direct port
- The segmented inputs use `useSegmentedInput` hook for keyboard nav between segments
- `CalendarDisplay` uses a simple calendar grid — port directly
- `WithFormContext` / `useRequiredFormContext` — port or inline the pattern
- Headless UI `Popover` for calendar popup — already available
- Replace `next-i18next` `useTranslation` with `react-i18next` `useTranslation`

**Strategy:** Copy all files mechanically, then fix imports. The logic is self-contained with no Next.js dependencies.

**Step 1:** Copy shared/core files (pure TS, no framework deps)
**Step 2:** Copy shared/input files (pure TS)
**Step 3:** Copy shared utilities + SegmentedInputWrapper
**Step 4:** Copy store (Zustand)
**Step 5:** Copy connected components
**Step 6:** Copy InputDatePicker and InputDatePickerDuration
**Step 7:** Port CalendarDisplay
**Step 8:** Verify with `yarn check`
**Step 9:** Commit: `feat: add date picker system`

---

### Task 7: BookingAddUpdateForm

Port the main form for adding/editing completed bookings.

**Files:**
- Create: `frontend_rr7/app/features/bookings/components/booking-add-update-form.tsx`

**Source:** `frontend/src/components/features/user/index/bookingAddUpdateForm.tsx`

**Adaptation notes:**
- Uses `react-hook-form` `useForm` + `FormProvider`
- Original calls `addUserBookingByOrganisation` / `updateUserBooking` directly
- RR7: submit via `useFetcher` to `/api/bookings` with intent `add` or `update`
- Add `add` intent to `api.bookings.ts` resource route
- Remove `motion/react` AnimatePresence — use CSS transition for preset panel slide
- `useSelectedDate` (Zustand) → read from URL search param `date` or loader data
- `useOrganisation` → read `selectedOrgId` from loader data
- Project list, tags come from `useFetcher.load('/api/booking-form-data?orgId=X')`
- Adjacent bookings come from parent loader data (same pattern as existing booking-item-context)
- Latest booking also from loader data or a fetch
- `DEFAULT_STRING_VALUE` → use empty string check
- Duration warning (>8h) — keep as-is
- Preset panel animation: replace motion spring with CSS transform transition

**New intent for api.bookings.ts:**
```typescript
case 'add': {
  const projectId = formData.get('projectId') as string
  const tags = JSON.parse((formData.get('tags') as string) || '[]')
  const start = formData.get('start') as string
  const end = formData.get('end') as string
  await addUserBookingByOrganisation(orgId, { projectId, tags, start, end }, { headers })
  return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
}
```

**Step 1:** Add `add` intent to api.bookings.ts
**Step 2:** Create the form component
**Step 3:** Verify with `yarn check`
**Step 4:** Commit: `feat: add BookingAddUpdateForm component`

---

### Task 8: BookingPresetSelector

Port the preset selector with tabs for recent/favorites/team bookings.

**Files:**
- Create: `frontend_rr7/app/features/bookings/components/booking-preset-selector.tsx`

**Source:** `frontend/src/components/features/user/index/bookingPresetSelector.tsx`

**Adaptation notes:**
- Uses `IconTabs` (already exists in RR7 at `~/components/ui/navigation/icon-tabs`)
- Three tabs: Recent, Favorites, Team — each loads data
- Original uses SWR hooks; RR7 version gets data from props (passed from the form which loads via `api.booking-form-data`)
- `AvatarUser` for team bookings — port or simplify to initials circle
- `DataFetchValidates` / `EmptyStatePresets` — port or use simple loading/empty states
- `AnimateList` → use CSS staggered fade-in (same pattern as booking-list-selected-day)
- `stringHash` → port from `frontend/src/lib/utils/string/stringHash.ts`

**Step 1:** Port stringHash utility
**Step 2:** Create the component
**Step 3:** Verify with `yarn check`
**Step 4:** Commit: `feat: add BookingPresetSelector component`

---

### Task 9: BookingEditRunning

Port the simpler form for editing a currently running booking.

**Files:**
- Create: `frontend_rr7/app/features/bookings/components/booking-edit-running.tsx`

**Source:** `frontend/src/components/features/user/index/bookingEditRunning.tsx`

**Adaptation notes:**
- Simpler than BookingAddUpdateForm — no end time, no duration
- Only fields: Project, Tags, Start time
- Original calls `updateUserBooking` directly; RR7 uses `useFetcher` → intent `update`
- Start time validation: must be in the past (`isFuture` check)
- Preset: use end time of latest booking as start
- Latest booking from `api.booking-form-data` loader

**Step 1:** Create the component
**Step 2:** Verify with `yarn check`
**Step 3:** Commit: `feat: add BookingEditRunning form component`

---

### Task 10: Wire modals into context menus

Connect the edit modals to the existing context menu components.

**Files:**
- Modify: `frontend_rr7/app/features/bookings/components/booking-item-context.tsx`
- Modify: `frontend_rr7/app/features/bookings/components/booking-current-entry-context.tsx`

**Changes for booking-item-context.tsx:**
- Add `useState` for modal open state
- Edit button opens modal with `setIsOpen(true)` + `handleCloseAll()`
- Render `<Modal>` with `<BookingAddUpdateForm mode="update" itemUpdate={item} />`

**Changes for booking-current-entry-context.tsx:**
- Add `useState` for modal open state
- Edit button opens modal with `setIsOpen(true)` + `handleCloseAll()`
- Render `<Modal>` with `<BookingEditRunning item={booking} />`

**Step 1:** Update booking-item-context.tsx
**Step 2:** Update booking-current-entry-context.tsx
**Step 3:** Verify with `yarn check`
**Step 4:** Manual test: click edit on a booking item → modal opens with correct data
**Step 5:** Commit: `feat: wire booking edit modals into context menus`

---

## API Route Intents Summary

After all tasks, `api.bookings.ts` handles these intents:
- `delete` — delete a booking (existing)
- `update` — update a completed booking (existing)
- `add` — add a new booking (Task 7)
- `addFavorite` — add to favorites (existing)
- `stopAndStart` — stop current + start new (existing)
- `stop` — stop current booking with midnight split (existing)
- `updateCurrent` — update running booking start time (existing)

---

## Notes

- All form submissions use `useFetcher` → resource route pattern (never direct API calls from client)
- Project/tag data loaded via `api.booking-form-data` resource route (server-side, with auth)
- The segmented date picker is the largest chunk (~15 files) but is self-contained
- `es-toolkit` may need to be added to `package.json` if not present — check first, otherwise use native alternatives
- The `CalendarDisplay` component internally uses a month grid — check if it has further deps
