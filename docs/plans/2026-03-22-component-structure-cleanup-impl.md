# Component Structure Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure `frontend_rr7/app/` so domain-specific code lives in `features/`, generic UI stays in `components/`, and `components/features/` is eliminated.

**Architecture:** File moves + import path updates. No logic changes. Each task moves one group of related files, updates all consumers, then verifies with `yarn check`.

**Tech Stack:** React Router 7, TypeScript, Yarn

---

### Task 1: Move stats components from `ui/` to `features/stats/`

**Files:**
- Move: `app/components/ui/charts/stats-tile.tsx` → `app/features/stats/components/stats-tile.tsx`
- Move: `app/components/ui/data-display/stats-tile-hours.tsx` → `app/features/stats/components/stats-tile-hours.tsx`
- Move: `app/components/ui/data-display/stats-tile-number.tsx` → `app/features/stats/components/stats-tile-number.tsx`
- Move: `app/components/ui/data-display/stats-tile-wrapper.tsx` → `app/features/stats/components/stats-tile-wrapper.tsx`
- Move: `app/components/ui/data-display/stats-group.tsx` → `app/features/stats/components/stats-group.tsx`
- Move: `app/components/ui/data-display/empty-state-stats.tsx` → `app/features/stats/components/empty-state-stats.tsx`
- Move: `app/components/ui/charts/bars-hours.tsx` → `app/features/stats/components/bars-hours.tsx`
- Move: `app/components/ui/charts/bars-tags.tsx` → `app/features/stats/components/bars-tags.tsx`

**Step 1: Move files**

```bash
cd frontend_rr7
mv app/components/ui/charts/stats-tile.tsx app/features/stats/components/stats-tile.tsx
mv app/components/ui/data-display/stats-tile-hours.tsx app/features/stats/components/stats-tile-hours.tsx
mv app/components/ui/data-display/stats-tile-number.tsx app/features/stats/components/stats-tile-number.tsx
mv app/components/ui/data-display/stats-tile-wrapper.tsx app/features/stats/components/stats-tile-wrapper.tsx
mv app/components/ui/data-display/stats-group.tsx app/features/stats/components/stats-group.tsx
mv app/components/ui/data-display/empty-state-stats.tsx app/features/stats/components/empty-state-stats.tsx
mv app/components/ui/charts/bars-hours.tsx app/features/stats/components/bars-hours.tsx
mv app/components/ui/charts/bars-tags.tsx app/features/stats/components/bars-tags.tsx
```

**Step 2: Update imports in consumers**

Files importing `stats-tile`:
- `app/features/stats/components/stats-bars-by-aggregated-tags.tsx`
- `app/features/stats/components/stats-circle-category-range.tsx`
- `app/features/stats/components/stats-project-stream.tsx`
- `app/features/stats/components/stats-bars-by-source.tsx`

These are now siblings — update from `~/components/ui/charts/stats-tile` to `~/features/stats/components/stats-tile` (or relative `./stats-tile`).

Files importing `stats-group`:
- `app/features/projects/components/my-projects-stats.tsx` → `~/features/stats/components/stats-group`
- `app/features/booking-history/components/booking-history-stats.tsx` → `~/features/stats/components/stats-group`
- `app/features/stats/components/stats-overview.tsx` → relative `./stats-group`

Update ALL import paths referencing the old locations. Search broadly for any missed imports.

**Step 3: Verify**

```bash
yarn check
```

Expected: All checks pass. Fix any remaining broken imports.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move stats components from ui/ to features/stats/"
```

---

### Task 2: Move chart infrastructure to `features/stats/`

**Files:**
- Move: `app/components/ui/charts/month-stream-chart.tsx` → `app/features/stats/components/month-stream-chart.tsx`
- Move: `app/components/ui/charts/weekly-trend-chart.tsx` → `app/features/stats/components/weekly-trend-chart.tsx`
- Move: `app/components/ui/charts/project-stream-chart-impl.tsx` → `app/features/stats/components/project-stream-chart-impl.tsx`
- Move: `app/components/ui/error-boundary-chart.tsx` → `app/features/stats/components/error-boundary-chart.tsx`

**Step 1: Move files**

```bash
cd frontend_rr7
mv app/components/ui/charts/month-stream-chart.tsx app/features/stats/components/month-stream-chart.tsx
mv app/components/ui/charts/weekly-trend-chart.tsx app/features/stats/components/weekly-trend-chart.tsx
mv app/components/ui/charts/project-stream-chart-impl.tsx app/features/stats/components/project-stream-chart-impl.tsx
mv app/components/ui/error-boundary-chart.tsx app/features/stats/components/error-boundary-chart.tsx
```

**Step 2: Update imports in consumers**

`error-boundary-chart` consumer:
- `app/features/stats/components/stats-content.tsx` → now a sibling, use relative `./error-boundary-chart`

The other 3 files currently have no consumers. Search broadly to confirm, then update any internal imports within the moved files themselves (they may import from `~/components/ui/charts/nivo-theme` etc. — those paths stay valid since nivo-theme stays in `ui/`).

**Step 3: Verify**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move chart components from ui/ to features/stats/"
```

---

### Task 3: Move project-domain components to `features/projects/`

**Files:**
- Move: `app/components/ui/data-display/fetch-state/empty-state-members.tsx` → `app/features/projects/components/empty-state-members.tsx`
- Move: `app/components/ui/data-display/fetch-state/empty-state-projects.tsx` → `app/features/projects/components/empty-state-projects.tsx`
- Move: `app/components/ui/data-display/project-last-activity.tsx` → `app/features/projects/components/project-last-activity.tsx`

**Step 1: Move files**

```bash
cd frontend_rr7
mv app/components/ui/data-display/fetch-state/empty-state-members.tsx app/features/projects/components/empty-state-members.tsx
mv app/components/ui/data-display/fetch-state/empty-state-projects.tsx app/features/projects/components/empty-state-projects.tsx
mv app/components/ui/data-display/project-last-activity.tsx app/features/projects/components/project-last-activity.tsx
```

**Step 2: Update imports in consumers**

- `app/features/projects/components/project-members-list.tsx` — imports `empty-state-members` → now sibling
- `app/features/projects/components/my-projects-list.tsx` — imports `empty-state-projects` and `project-last-activity` → now siblings

**Step 3: Check if `fetch-state/` directory is now empty**

If empty after moving these two files, check if other files remain. If empty, delete the directory.

**Step 4: Verify**

```bash
yarn check
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move project-domain components from ui/ to features/projects/"
```

---

### Task 4: Move `components/features/context-menu/` to `features/context-menu/`

**Files:**
- Move: entire `app/components/features/context-menu/` → `app/features/context-menu/`

**Step 1: Move directory**

```bash
cd frontend_rr7
mv app/components/features/context-menu app/features/context-menu
```

**Step 2: Update imports in all consumers**

Search for all imports containing `components/features/context-menu` and replace with `features/context-menu`. Consumers span many features:
- `app/features/home/components/` (favourite-item-context, organisation-item-context, etc.)
- `app/features/bookings/components/booking-list-selected-day.tsx`
- `app/features/projects/components/` (admin-context, member-context files)
- `app/features/booking-history/components/`

Also update any internal imports within context-menu files themselves.

**Step 3: Verify**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move context-menu from components/features/ to features/"
```

---

### Task 5: Move `components/features/login/` to `features/auth/`

**Files:**
- Move: entire `app/components/features/login/` → `app/features/auth/`

**Step 1: Move directory**

```bash
cd frontend_rr7
mkdir -p app/features/auth
mv app/components/features/login/* app/features/auth/
rmdir app/components/features/login
```

**Step 2: Update imports in consumers**

Search for `components/features/login` and replace with `features/auth`. Consumers:
- `app/features/invitation/components/` (4 files)
- `app/routes/internal-oauth.login.tsx`
- `app/routes/login.tsx`
- `app/routes/internal-oauth.register.tsx`

**Step 3: Verify**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move login components to features/auth/"
```

---

### Task 6: Merge `components/features/system/` into `features/system/`

**Files:**
- Move: contents of `app/components/features/system/` → `app/features/system/components/`

`features/system/` already exists with `websocket/`. The components from `components/features/system/` (BackendStatus, WebsocketStatus, DevInfoBadge) need a `components/` subfolder.

**Step 1: Create components dir and move**

```bash
cd frontend_rr7
mkdir -p app/features/system/components
mv app/components/features/system/* app/features/system/components/
rmdir app/components/features/system
```

**Step 2: Update imports in consumers**

Search for `components/features/system` and replace with `features/system/components`. Consumers:
- `app/components/ui/navigation/tegonal-footer.tsx`
- `app/routes/app-layout.tsx`

**Step 3: Verify**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: merge system components into features/system/"
```

---

### Task 7: Move `components/features/issue-importers/` to `features/issue-importers/`

**Files:**
- Move: entire `app/components/features/issue-importers/` → `app/features/issue-importers/`

**Step 1: Move directory**

```bash
cd frontend_rr7
mv app/components/features/issue-importers app/features/issue-importers
```

**Step 2: Update imports in consumers**

Search for `components/features/issue-importers`. Consumer:
- `app/components/ui/data-display/tag-list.tsx` — imports `ImporterTypeIcon`

**Step 3: Delete `components/features/` if now empty**

```bash
# Check if anything remains
ls app/components/features/
# If empty:
rmdir app/components/features
```

**Step 4: Verify**

```bash
yarn check
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move issue-importers to features/ and remove components/features/"
```

---

### Task 8: Move domain hooks to feature folders

**Files:**
- Move: `app/hooks/use-booking-form-data.ts` → `app/features/bookings/hooks/use-booking-form-data.ts`
- Move: `app/hooks/use-stop-and-start.ts` → `app/features/bookings/hooks/use-stop-and-start.ts`
- Move: `app/hooks/use-stop-booking.ts` → `app/features/bookings/hooks/use-stop-booking.ts`
- Move: `app/hooks/use-calendar-month.ts` → `app/features/calendar/hooks/use-calendar-month.ts`

**Step 1: Move files**

```bash
cd frontend_rr7
mv app/hooks/use-booking-form-data.ts app/features/bookings/hooks/use-booking-form-data.ts
mv app/hooks/use-stop-and-start.ts app/features/bookings/hooks/use-stop-and-start.ts
mv app/hooks/use-stop-booking.ts app/features/bookings/hooks/use-stop-booking.ts
mv app/hooks/use-calendar-month.ts app/features/calendar/hooks/use-calendar-month.ts
```

**Step 2: Update imports in consumers**

Booking hooks consumers:
- `app/features/home/components/booking-start.tsx` — use-booking-form-data, use-stop-and-start
- `app/features/bookings/components/booking-edit-running.tsx` — use-booking-form-data
- `app/features/home/components/favorite-item-context.tsx` — use-stop-and-start
- `app/features/home/components/organisation-item-context.tsx` — use-stop-and-start
- `app/features/bookings/components/booking-item-context.tsx` — use-stop-and-start
- `app/features/bookings/components/booking-current.tsx` — use-stop-booking

Calendar hook consumers:
- `app/features/dashboard/components/calendar-month-compact.tsx` — use-calendar-month
- `app/components/ui/forms/input/calendar/calendar-display.tsx` — use-calendar-month

**Step 3: Verify**

```bash
yarn check
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move domain hooks to their feature folders"
```

---

### Task 9: Final verification and cleanup

**Step 1: Verify no stale imports remain**

Search the entire `frontend_rr7/app/` for any import paths referencing:
- `components/features/` (should be zero — directory deleted)
- `components/ui/charts/stats-tile` (moved)
- `components/ui/data-display/stats-` (moved)
- `components/ui/data-display/fetch-state/empty-state-` (moved)
- `components/ui/data-display/project-last-activity` (moved)
- `components/ui/error-boundary-chart` (moved)
- `~/hooks/use-booking-form-data` (moved)
- `~/hooks/use-stop-` (moved)
- `~/hooks/use-calendar-month` (moved)

**Step 2: Full build**

```bash
yarn check
```

**Step 3: Verify `components/features/` is gone**

```bash
ls app/components/features/ 2>&1  # Should say "No such file or directory"
```

**Step 4: Verify remaining `hooks/` are cross-cutting only**

```bash
ls app/hooks/
# Expected: use-api-proxy.ts, use-layout-loader-data.ts, use-persisted-search-param.ts, use-scroll-pagination.ts
```

**Step 5: Commit if any cleanup was needed**

```bash
git add -A
git commit -m "refactor: final cleanup of component structure"
```
