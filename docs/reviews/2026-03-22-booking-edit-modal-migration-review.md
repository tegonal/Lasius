# Booking Edit Modal Migration Review

**Date:** 2026-03-22
**Scope:** Booking form components, input components, date pickers, context menus, dropdowns
**Verdict:** Partial match -- core functionality preserved, several missing features

---

## 1. BookingAddUpdateForm

**Files:** `frontend/src/components/features/user/index/bookingAddUpdateForm.tsx` -> `frontend_rr7/app/features/bookings/components/booking-add-update-form.tsx`

**Match:** Partial

### Critical differences

1. **Missing `addBetween` mode.** The original supports three modes: `add`, `update`, and `addBetween`. The RR7 version only supports `add` and `update`. The `addBetween` mode pre-fills start/end from adjacent bookings and is used from `BookingInsertActions`. This is a user-facing feature loss.

2. **Missing `itemReference` prop.** In the original, `mode === 'add' && itemReference` sets the start time to the reference booking's end time. The RR7 version has no `itemReference` prop, so "add after this booking" flow is broken.

3. **Missing preset panel slide animation.** The original uses `AnimatePresence` + `m.div` with spring transitions to slide the preset panel in from the right while sliding the form to the left. The RR7 version renders the form directly without the animated panel/form toggle wrapper.

4. **Missing "Browse presets" button + help button row.** The original renders a row with "Browse presets" button (opens the sliding preset panel) and a help button (calls `openHelp('modal-add-edit-booking')`). The RR7 form lacks this row entirely.

5. **Missing `presetEnd` button on end date picker.** The original computes a `presetEnd` button that snaps the end time to the next booking's start time (with `ArrowUpToLine` icon). The RR7 version only has `presetStart`, not `presetEnd`.

6. **Missing adjacent booking awareness.** The original uses `useGetAdjacentBookings` to find `bookingBeforeCurrent` and `bookingAfterCurrent` for the preset start/end buttons with smart "already aligned" detection (`isWithinSameMinute`). The RR7 version lacks this logic.

7. **Missing `labelActionSlot` / `onRenderLabelAction` for reset buttons.** The original passes `onRenderLabelAction={setStartResetButton}` and `labelActionSlot={startResetButton}` to render reset buttons in form element labels. The RR7 version passes `setStartResetButton` / `setEndResetButton` as `onRenderResetButton` but the `FormElement` rendering of this slot needs verification.

### Acceptable differences (framework adaptation)

- `useFetcher` + `addBookingApi.submit()` / `updateBookingApi.submit()` replacing direct `await addUserBookingByOrganisation()` / `await updateUserBooking()` -- correct RR7 pattern.
- `useOrganisation()` replaced by prop-passed `selectedOrgId` -- acceptable.
- `useSelectedDate()` from Zustand replaced by `dateForForm` prop (URL search params) -- acceptable.
- `useCallback` wrapping `onSubmit` -- acceptable.

---

## 2. BookingEditRunning

**Files:** `frontend/src/components/features/user/index/bookingEditRunning.tsx` -> `frontend_rr7/app/features/bookings/components/booking-edit-running.tsx`

**Match:** Partial

### Important differences

1. **Different API call for submission.** Original calls `updateUserBooking()` (general booking update). RR7 version calls `updateBookingApi.submit()` which maps to a custom hook. Both send projectId, start, and tags -- functionally equivalent but verify the RR7 hook calls the correct backend endpoint.

2. **Data loading pattern changed.** Original uses SWR hooks (`useGetBookingLatest`, `useGetTagsByProject`). RR7 uses `formDataFetcher.load('/api/booking-form-data?...')` to load projects and tags. This is a correct framework adaptation but needs to ensure the same data is returned.

3. **Missing `projects` prop in original.** Original uses SWR to self-fetch projects. RR7 receives `projects` via fetcher response. Functionally equivalent.

4. **Form fields match.** Both have: projectId (ProjectSelect), tags (InputTagsAutocomplete), start (InputDatePicker). The RR7 version correctly omits the end field (running bookings have no end).

5. **Preset start button preserved.** Both show `presetStart` with `ArrowDownToLine` icon pointing to the latest booking's end time. Match is good.

### Acceptable differences

- `useFetcher` replacing `mutate(getUserBookingCurrent())` for cache invalidation -- correct.
- Closing on success via `useEffect` watching `updateBookingApi.state` -- acceptable.

---

## 3. BookingPresetSelector

**Files:** `frontend/src/components/features/user/index/bookingPresetSelector.tsx` -> `frontend_rr7/app/features/bookings/components/booking-preset-selector.tsx`

**Match:** Partial

### Important differences

1. **Data fetching moved to props.** Original fetches data internally via SWR hooks (`useGetUserBookingList`, `useGetFavoriteBookingList`, org bookings). RR7 version receives `recentBookings`, `favorites`, `orgBookings` as props. This is a correct architectural change but the *caller must supply the data*.

2. **Missing `DataFetchValidates` loading states.** Original shows `<DataFetchValidates isValidating={isValidating} />` while data loads. RR7 version shows nothing for loading (data is pre-fetched). This changes UX if data loads slowly.

3. **Missing `AvatarUser` component.** Original uses `<AvatarUser firstName={firstName} lastName={lastName} size={32} />` in team bookings list. RR7 uses `<AvatarInitials>` instead. Verify visual equivalence.

4. **Tab structure preserved.** Both have Recent, Favorites, Team tabs with matching icons (Clock, Star, Users).

5. **Back button + title preserved.** Both render a back button and "Choose a preset" heading.

6. **Deduplication logic preserved.** Both deduplicate by project + sorted tag IDs, limit to 20.

---

## 4. InputSelectAutocomplete

**Files:** `frontend/src/components/ui/forms/input/InputSelectAutocomplete.tsx` -> `frontend_rr7/app/components/ui/forms/input/input-select-autocomplete.tsx`

**Match:** Yes

Core functionality matches: filtering, keyboard navigation (up/down/enter/escape), dropdown positioning, selected item display, clear button. CSS classes are identical.

---

## 5. InputTagsAutocomplete

**Files:** `frontend/src/components/ui/forms/input/InputTagsAutocomplete.tsx` -> `frontend_rr7/app/components/ui/forms/input/input-tags-autocomplete.tsx`

**Match:** Yes

Tag add/remove, suggestion filtering, keyboard navigation, pill rendering all match. CSS classes are identical.

---

## 6. ProjectSelect

**Files:** `frontend/src/components/ui/forms/input/ProjectSelect.tsx` -> `frontend_rr7/app/components/ui/forms/input/project-select.tsx`

**Match:** Yes

Both are thin wrappers over InputSelectAutocomplete with project-specific logic (inactive project handling, fallback project). The RR7 version adds `allProjects` prop for cross-org lookup -- an additive enhancement, not a deviation.

---

## 7. InputDatePicker

**Files:** `frontend/src/components/ui/forms/input/datePicker/InputDatePicker.tsx` -> `frontend_rr7/app/components/ui/forms/input/date-picker/input-date-picker.tsx`

**Match:** Partial (needs deeper review)

Both implement segmented date-time inputs with DayPicker calendar popup and preset buttons. The RR7 version uses a refactored segmented input system. Visual equivalence should be verified in browser.

---

## 8. InputDatePickerDuration

**Files:** `frontend/src/components/ui/forms/input/datePicker/InputDatePickerDuration.tsx` -> `frontend_rr7/app/components/ui/forms/input/date-picker/input-date-picker-duration.tsx`

**Match:** Yes

Both compute and display duration from start/end fields. The RR7 version uses extracted utility (`calculateDurationMinutes`).

---

## 9. BookingItemContext

**Files:** `frontend/src/components/features/user/index/list/bookingItemContext.tsx` -> `frontend_rr7/app/features/bookings/components/booking-item-context.tsx`

**Match:** Yes

All context menu buttons preserved: Start, Edit, Adjust Start to Previous, Adjust End to Next, Add Favorite, Delete, Close. The RR7 version uses `useFetcher` for mutations instead of direct API calls. Both use `areTimesWithinOneMinute` for conditional button display.

---

## 10. BookingCurrentEntryContext

**Files:** `frontend/src/components/features/user/index/current/bookingCurrentEntryContext.tsx` -> `frontend_rr7/app/features/bookings/components/booking-current-entry-context.tsx`

**Match:** Yes

Edit button, adjust-start-to-previous button, add-favorite button, close button all preserved. Uses `useFetcher` for mutations. Modal opens BookingEditRunning on edit.

---

## 11. DropdownList / DropdownListItem

**Files:** `frontend/src/components/ui/forms/input/shared/dropdownList.tsx` -> `frontend_rr7/app/components/ui/forms/input/shared/dropdown-list.tsx`
**Files:** `frontend/src/components/ui/forms/input/shared/dropdownListItem.tsx` -> `frontend_rr7/app/components/ui/forms/input/shared/dropdown-list-item.tsx`

**Match:** Yes

Identical CSS classes, identical props, identical rendering. Only difference is import path style (`lib/utils/cn` vs `~/lib/utils/cn`).

---

## Overall Verdict

The migration is **mostly faithful** for the low-level UI components (inputs, dropdowns, context menus) but has **significant gaps** in the main `BookingAddUpdateForm` component, which is the most complex and user-facing piece.

## Prioritized Fix List

### Critical (user will notice, functionality lost)

1. **Add `addBetween` mode to BookingAddUpdateForm.** Without it, users cannot insert bookings between existing ones -- a core feature used from the booking list.

2. **Add `itemReference` prop to BookingAddUpdateForm.** Without it, the "add after this booking" flow (setting start = reference end) is broken.

3. **Add preset panel with slide animation.** The "Browse presets" button and animated slide panel is a prominent UI feature. Without it, users lose the ability to quickly select from recent bookings, favorites, or team bookings from within the add/edit form.

### Important (should fix, UX degradation)

4. **Add `presetEnd` button on end date picker.** Users lose the "snap end to next booking start" shortcut, which prevents efficient gap-closing.

5. **Add adjacent booking awareness** (`bookingBeforeCurrent`, `bookingAfterCurrent`) to drive smart preset start/end buttons with "already aligned" suppression.

6. **Add help button** (`openHelp('modal-add-edit-booking')`) to the form header row.

### Minor (cosmetic, no functional impact)

7. **Verify `AvatarInitials` vs `AvatarUser` visual equivalence** in preset selector team tab.

8. **Verify loading states** when preset selector data is being fetched (original shows spinner, RR7 may show empty).
