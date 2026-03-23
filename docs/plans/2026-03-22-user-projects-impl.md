# User/Projects Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the user/projects page from Next.js to React Router 7 as a 1:1 replica.

**Architecture:** Three-column layout (nav left, project list center, search/info right) rendered inside the existing `user.home` layout route. Projects data loaded via route loader from user profile. Mutations (create, update, leave) via `useFetcher` + route actions. Context menus use shared context menu system with Framer Motion animations.

**Tech Stack:** React Router 7, react-i18next, react-hook-form, zod, boring-avatars, date-fns, es-toolkit, motion/react, useFetcher for mutations.

---

## Important Conventions

- All components use arrow functions (not `function` declarations)
- All files need the AGPL license header (copy from any existing file in `frontend_rr7/`)
- Use `~/` import alias (maps to `app/`)
- File names use kebab-case
- Use `react-i18next` (`useTranslation`) not `next-i18next`
- Use `useNavigate` from `react-router` instead of `useRouter` from `next/router`
- No SWR — data from loaders (`useLoaderData`/`useRouteLoaderData`), mutations via `useFetcher`
- Use existing API functions from `~/services/api/lasius/` (Orval-generated, DO NOT EDIT)
- `ROLES` constant exists at `~/config/constants`

---

### Task 1: Shared UI — DataList Components

**Files:**
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list-row.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list-field.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/data-list-header-item.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/data-list/index.ts`

**What to build:**
Migrate from `frontend/src/components/ui/data-display/dataList/`. These are pure presentational table-like components:

- `DataList` — wrapper `<div>` with table-like styling
- `DataListRow` — a row container
- `DataListField` — a cell, accepts optional `width` prop (number in px)
- `DataListHeaderItem` — header cell with distinct styling

Read the originals in `frontend/src/components/ui/data-display/dataList/` and replicate exactly with RR7 conventions (arrow functions, kebab-case files, `~/` imports).

**Step 1:** Read all 4 original files in `frontend/src/components/ui/data-display/dataList/`
**Step 2:** Create all 4 component files + barrel index.ts
**Step 3:** Run `yarn check` from `frontend_rr7/`
**Step 4:** Commit: `feat: add DataList shared UI components`

---

### Task 2: Shared UI — Stats Components

**Files:**
- Create: `frontend_rr7/app/components/ui/data-display/stats-group.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/stats-tile-number.tsx`

**What to build:**
Migrate from `frontend/src/components/ui/data-display/StatsGroup.tsx` and `StatsTileNumber.tsx`.

- `StatsGroup` — DaisyUI `stats` wrapper (responsive: vertical on small, horizontal on lg)
- `StatsTileNumber` — displays a number + label in a stat tile, uses CVA for variants

Read originals and replicate exactly.

**Step 1:** Read the 2 original files
**Step 2:** Create both components
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add StatsGroup and StatsTileNumber components`

---

### Task 3: Shared UI — AvatarProject, EmptyStates, ProjectLastActivity

**Files:**
- Create: `frontend_rr7/app/components/ui/data-display/avatar/avatar-project.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/fetch-state/empty-state-projects.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/fetch-state/empty-state-members.tsx`
- Create: `frontend_rr7/app/components/ui/data-display/project-last-activity.tsx`

**What to build:**

- `AvatarProject` — uses `boring-avatars` (already in package.json). Follow same pattern as `avatar-organisation.tsx` but with the project-specific palette from `frontend/src/components/ui/data-display/avatar/avatarProject.tsx`
- `EmptyStateProjects` / `EmptyStateMembers` — centered icon + i18n text, simple presentational
- `ProjectLastActivity` — displays formatted date. Original uses SWR hook to fetch last activity. **Adaptation:** In RR7, load the last activity dates in the route loader and pass them as props. Remove the conditional fetch pattern — just display the prop value. If prop is undefined/null, show "—".

Read originals from:
- `frontend/src/components/ui/data-display/avatar/avatarProject.tsx`
- `frontend/src/components/ui/data-display/fetchState/emptyStateProjects.tsx`
- `frontend/src/components/ui/data-display/fetchState/emptyStateMembers.tsx`
- `frontend/src/components/ui/data-display/ProjectLastActivity.tsx`

**Step 1:** Read originals
**Step 2:** Create all 4 components
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add AvatarProject, EmptyState, and ProjectLastActivity components`

---

### Task 4: Context Menu System

**Files:**
- Create: `frontend_rr7/app/features/context-menu/hooks/use-context-menu.ts`
- Create: `frontend_rr7/app/features/context-menu/context-body.tsx`
- Create: `frontend_rr7/app/features/context-menu/context-bar.tsx`
- Create: `frontend_rr7/app/features/context-menu/context-bar-divider.tsx`
- Create: `frontend_rr7/app/features/context-menu/context-button-wrapper.tsx`
- Create: `frontend_rr7/app/features/context-menu/context-animate-presence.tsx`
- Create: `frontend_rr7/app/features/context-menu/buttons/context-button-open.tsx`
- Create: `frontend_rr7/app/features/context-menu/buttons/context-button-close.tsx`
- Create: `frontend_rr7/app/features/context-menu/buttons/context-button-leave-project.tsx`

**What to build:**
Migrate the entire context menu system from `frontend/src/components/features/contextMenu/`.

- `useContextMenu` hook — manages which context menu ID is open (Zustand store or React context). Read original at `frontend/src/components/features/contextMenu/hooks/useContextMenu.ts`
- `ContextBody` — wrapper with CVA variants (`compact`, etc.)
- `ContextBar` — row of action buttons
- `ContextBarDivider` — visual separator
- `ContextButtonWrapper` — wraps individual buttons with CVA variants
- `ContextAnimatePresence` — Framer Motion enter/exit animation wrapper
- `ContextButtonOpen` — toggle button to open context menu (receives `hash` prop)
- `ContextButtonClose` — close button
- `ContextButtonLeaveProject` — leave project action with confirmation. Uses `useFetcher` to call `removeProjectOwnUser` API instead of direct API call + SWR mutate.

Read all originals from `frontend/src/components/features/contextMenu/` directory.

**Step 1:** Read all original context menu files
**Step 2:** Create the `useContextMenu` hook first
**Step 3:** Create all UI components
**Step 4:** Create the `ContextButtonLeaveProject` button (adapt to use `useFetcher`)
**Step 5:** Run `yarn check`
**Step 6:** Commit: `feat: add context menu system`

---

### Task 5: Shared UI — Modal Subcomponents

**Files:**
- Create: `frontend_rr7/app/components/ui/overlays/modal/modal-close-button.tsx`
- Create: `frontend_rr7/app/components/ui/overlays/modal/modal-header.tsx`
- Create: `frontend_rr7/app/components/ui/overlays/modal/modal-description.tsx`
- Create: `frontend_rr7/app/components/ui/overlays/modal/generic-confirm-modal.tsx`
- Create: `frontend_rr7/app/components/ui/overlays/modal/generic-input-modal.tsx`

**What to build:**
Check which of these already exist in `frontend_rr7/app/components/ui/overlays/`. For any that don't exist, migrate from `frontend/src/components/ui/overlays/modal/`:

- `ModalCloseButton` — X button positioned absolute top-right
- `ModalHeader` — heading for modals
- `ModalDescription` — description text below header
- `GenericConfirmModal` — reusable confirm dialog (message + confirm/cancel buttons)
- `GenericInputModal` — reusable text input dialog with react-hook-form register

**Step 1:** Check what already exists in `frontend_rr7/app/components/ui/overlays/`
**Step 2:** Read originals for missing components
**Step 3:** Create missing components
**Step 4:** Run `yarn check`
**Step 5:** Commit: `feat: add modal subcomponents`

---

### Task 6: Dynamic Translation Strings

**Files:**
- Create: `frontend_rr7/app/config/dynamic-translation-strings.ts`

**What to build:**
Migrate `frontend/src/dynamicTranslationStrings.ts`. Contains `UserRoles` mapping (e.g., `ProjectAdministrator` → translated "Administrator"). Used by the project list to display role names.

Adapt: Use `react-i18next` `t()` function approach, or just use the same pattern (standalone `t` function that returns defaultValue).

**Step 1:** Read original `frontend/src/dynamicTranslationStrings.ts`
**Step 2:** Create the RR7 version
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add dynamic translation strings`

---

### Task 7: Utility — isAdminOfProject

**Files:**
- Create: `frontend_rr7/app/lib/api/functions/is-admin-of-project.ts`

**What to build:**
Simple utility that checks if a user has `ProjectAdministrator` role for a given project in a given org. Read original at `frontend/src/lib/api/functions/isAdminOfProject.ts`.

```typescript
import { type ModelsUser } from '~/services/api/lasius/modelsUser'
import { ROLES } from '~/config/constants'

export const isAdminOfProject = (
  profile: ModelsUser | undefined,
  organisationId: string,
  projectId: string,
) => {
  const selectedOrganisation = profile?.organisations.find(
    (org) => org.organisationReference.id === organisationId,
  )
  const selectProject = selectedOrganisation?.projects.find(
    (proj) => proj.projectReference.id === projectId,
  )
  return selectProject?.role === ROLES.PROJECT_ADMIN
}
```

**Step 1:** Create the file
**Step 2:** Run `yarn check`
**Step 3:** Commit: `feat: add isAdminOfProject utility`

---

### Task 8: useProjects Hook

**Files:**
- Create: `frontend_rr7/app/features/projects/hooks/use-projects.ts`

**What to build:**
Migrate `frontend/src/lib/api/hooks/useProjects.tsx`. **Key adaptation:** Original uses `useProfile()` + SWR. RR7 version reads user data from the app-layout route loader via `useRouteLoaderData('routes/app-layout')`.

Returns:
- `projectSuggestions()` — sorted project references for autocomplete (active projects only)
- `userProjects()` — full sorted array of user projects for the selected org
- `findProjectById(id)` — find any project by ID across all orgs

Use `useOrganisation` hook pattern as reference — it already reads from `useRouteLoaderData('routes/app-layout')`.

**Step 1:** Read original `frontend/src/lib/api/hooks/useProjects.tsx`
**Step 2:** Read `frontend_rr7/app/features/organisation/hooks/use-organisation.ts` for the loader data pattern
**Step 3:** Create the hook
**Step 4:** Run `yarn check`
**Step 5:** Commit: `feat: add useProjects hook`

---

### Task 9: Route — user.projects Layout + Index

**Files:**
- Create: `frontend_rr7/app/routes/user.projects.tsx`
- Create: `frontend_rr7/app/routes/user.projects._index.tsx`

**What to build:**

**`user.projects.tsx`** — Layout route. Follows the same pattern as `user.home.tsx`. Just renders `<Outlet />` since the `user.home` layout already provides the nav column.

**`user.projects._index.tsx`** — Page route with loader + action.

Loader:
- `requireUser(request)` for auth
- Get `selectedOrgId` from user profile (same pattern as `user.home._index.tsx`)
- Fetch project last activity dates for each project in parallel using `getProjectLastActivityDate` from `~/services/api/lasius/projects/projects`
- Return `{ selectedOrgId, lastActivityDates }` (map of projectId → date string)

Action (handles form submissions from fetchers):
- `intent: 'createProject'` → calls `createProject(orgId, body)`
- `intent: 'updateProject'` → calls `updateProject(orgId, projectId, body)`
- Returns `{ ok: true }` or `{ ok: false, error: message }` with appropriate status codes

Component renders `MyProjectsLayout`.

**Step 1:** Read `user.home.tsx` and `user.home._index.tsx` for exact route patterns
**Step 2:** Create `user.projects.tsx` (simple layout wrapper)
**Step 3:** Create `user.projects._index.tsx` with loader, action, and component
**Step 4:** Run `yarn check`
**Step 5:** Commit: `feat: add user.projects route with loader and action`

---

### Task 10: MyProjectsLayout + MyProjectsStats + MyProjectsRightColumn

**Files:**
- Create: `frontend_rr7/app/features/projects/components/my-projects-layout.tsx`
- Create: `frontend_rr7/app/features/projects/components/my-projects-stats.tsx`
- Create: `frontend_rr7/app/features/projects/components/my-projects-right-column.tsx`

**What to build:**

**`my-projects-layout.tsx`** — Two-panel layout (center column: stats + list, right column: heading + search). Uses `ColumnCenter`, `ColumnRight`, `innerGridClasses` from `layout-columns`. Has `useState` for `isCreateOpen` and `searchTerm`. Opens a `Modal` with `ProjectAddUpdateForm` for create.

Read original: `frontend/src/components/features/user/projects/myProjectsLayout.tsx`

Framework adaptations:
- `useProjects()` → the new hook from Task 8
- `ScrollContainer` → `ScrollArea` from `~/components/ui/layouts/scroll-area`
- `Modal` → from `~/components/ui/overlays/modal`

**`my-projects-stats.tsx`** — Stats bar showing project count + "Create project" button. Read original: `frontend/src/components/features/user/projects/myProjectsStats.tsx`

**`my-projects-right-column.tsx`** — Heading, description, search input (shown when >10 projects). Read original: `frontend/src/components/features/user/projects/myProjectsRightColumn.tsx`

Adaptations:
- `next-i18next` → `react-i18next`
- Check what `Input` component exists in RR7 (`~/components/ui/forms/input/` or similar)
- Check what `Button` component exists in RR7

**Step 1:** Read all 3 originals
**Step 2:** Check existing RR7 UI components (Input, Button, Heading, Text equivalents)
**Step 3:** Create all 3 components
**Step 4:** Run `yarn check`
**Step 5:** Commit: `feat: add MyProjectsLayout, stats, and right column`

---

### Task 11: MyProjectsList

**Files:**
- Create: `frontend_rr7/app/features/projects/components/my-projects-list.tsx`

**What to build:**
Migrate `frontend/src/components/features/user/projects/myProjectsList.tsx`.

DataList table with columns: avatar, name, role, last activity, context menu.

Adaptations:
- `useProjects()` → new hook from Task 8
- `useOrganisation()` → existing hook
- `useIsClient()` → not needed in RR7 (remove the guard)
- `UserRoles` → from `~/config/dynamic-translation-strings`
- `stringHash` → check if it exists in RR7, otherwise use a simple key
- `ProjectLastActivity` → pass `lastActivityDate` prop from loader data (accessed via `useLoaderData`)
- `DataList` components → from Task 1
- `AvatarProject` → from Task 3
- `EmptyStateProjects` → from Task 3
- Context menu components → from Tasks 12-13

**Step 1:** Read original
**Step 2:** Create the component (may stub context menu imports initially)
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add MyProjectsList component`

---

### Task 12: MyProjectsListItemMemberContext

**Files:**
- Create: `frontend_rr7/app/features/projects/components/my-projects-list-item-member-context.tsx`

**What to build:**
Simple context menu for non-admin project members. Only has "Leave project" + close buttons.

Read original: `frontend/src/components/features/user/projects/myProjectsListItemMemberContext.tsx`

Uses: `ContextBody`, `ContextButtonOpen`, `ContextAnimatePresence`, `ContextBar`, `ContextButtonLeaveProject`, `ContextBarDivider`, `ContextButtonClose`, `useContextMenu`, `AnimatePresence` from motion/react.

**Step 1:** Read original
**Step 2:** Create the component using context menu components from Task 4
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add member context menu for projects list`

---

### Task 13: ProjectAddUpdateForm

**Files:**
- Create: `frontend_rr7/app/features/projects/components/project-add-update-form.tsx`

**What to build:**
Migrate `frontend/src/components/features/projects/projectAddUpdateForm.tsx`.

Form with single "project name" field, zod validation, react-hook-form.

**Key adaptation — mutations:** Original uses direct API calls (`createProject`/`updateProject`) + SWR `mutate()`. RR7 version uses `useFetcher`:

```typescript
const fetcher = useFetcher()

const onSubmit = async () => {
  fetcher.submit(
    { intent: 'createProject', projectKey },
    { method: 'post' }
  )
}
```

The route action (Task 9) handles the API call server-side. On success, RR7 automatically revalidates all loaders (replacing SWR's `mutate`).

Handle errors from fetcher: check `fetcher.data` for error responses.

**Step 1:** Read original
**Step 2:** Create the component adapted for `useFetcher`
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add ProjectAddUpdateForm component`

---

### Task 14: MyProjectsListItemAdministratorContext

**Files:**
- Create: `frontend_rr7/app/features/projects/components/my-projects-list-item-admin-context.tsx`

**What to build:**
Migrate `frontend/src/components/features/user/projects/myProjectsListItemAdministratorContext.tsx`.

Context menu with 6 actions: manage members, show lists, show stats, edit project, edit tags, leave project. Each opens a modal or navigates.

Adaptations:
- `useRouter().push()` → `useNavigate()` from `react-router`
- Routes: `/user/stats?projectId=...` and `/user/lists?projectId=...` — keep these URLs (they'll be migrated later)
- Modal components: `Modal` from `~/components/ui/overlays/modal`
- `ProjectAddUpdateForm` → from Task 13
- `ProjectAddUpdateTagsForm` → from Task 16 (can import but may not exist yet — create the file in Task 16)
- `ManageProjectMembers` → from Task 17

**Step 1:** Read original
**Step 2:** Create the component
**Step 3:** Run `yarn check`
**Step 4:** Commit: `feat: add administrator context menu for projects list`

---

### Task 15: ManageProjectMembers + ProjectMembersList + supporting components

**Files:**
- Create: `frontend_rr7/app/features/projects/components/manage-members.tsx`
- Create: `frontend_rr7/app/features/projects/components/project-members-list.tsx`
- Create: `frontend_rr7/app/features/projects/components/project-member-list-item-context.tsx`
- Create: `frontend_rr7/app/features/projects/components/manage-project-members-stats.tsx`
- Create: `frontend_rr7/app/features/projects/components/manage-user-invite-by-email-form.tsx`
- Create: `frontend_rr7/app/lib/api/functions/is-admin-of-project.ts` (if not done in Task 7)

**What to build:**
Full member management modal system.

Read originals:
- `frontend/src/components/features/projects/manageMembers.tsx`
- `frontend/src/components/features/projects/projectMembersList.tsx`
- `frontend/src/components/features/projects/projectMemberListItemContext.tsx`
- `frontend/src/components/features/projects/manageProjectMembersStats.tsx`
- `frontend/src/components/features/user/manageUserInviteByEmailForm.tsx`

Adaptations:
- `ManageProjectMembers` original fetches members via `getProjectUserList` in a `useEffect`. In RR7, use `useFetcher` to load on mount: `fetcher.load('/api/project-members?orgId=...&projectId=...')`. Or keep the direct API call since this is a modal opened client-side (not a route transition). Check if direct API calls work from client in RR7 — if `getProjectUserList` uses `lasiusFetch` with server-only config, then create a resource route for this.
- `removeProjectUser` — same consideration. If server-only, add intent to route action.
- `inviteProjectUser` / `inviteOrganisationUser` — same.
- `useProfile()` → derive from `useRouteLoaderData('routes/app-layout')`
- `useIsClient()` → remove

**Step 1:** Read all 5 originals
**Step 2:** Determine if API calls work client-side or need resource routes
**Step 3:** Create all components
**Step 4:** Run `yarn check`
**Step 5:** Commit: `feat: add project member management components`

---

### Task 16: Tag Manager Feature

**Files:**
- Create: `frontend_rr7/app/features/tag-manager/components/project-add-update-tags-form.tsx`
- Create: `frontend_rr7/app/features/tag-manager/components/tag-group-item.tsx`
- Create: `frontend_rr7/app/features/tag-manager/components/tag-group-toolbar.tsx`
- Create: `frontend_rr7/app/features/tag-manager/components/tag-group-empty-state.tsx`
- Create: `frontend_rr7/app/features/tag-manager/hooks/use-tag-group-operations.ts`
- Create: `frontend_rr7/app/features/tag-manager/hooks/use-unsaved-changes.ts`

**What to build:**
Migrate the entire tag manager feature.

Read originals:
- `frontend/src/components/features/projects/projectAddUpdateTagsForm.tsx`
- `frontend/src/components/features/projects/tagManager/TagGroupItem.tsx`
- `frontend/src/components/features/projects/tagManager/TagGroupToolbar.tsx`
- `frontend/src/components/features/projects/tagManager/TagGroupEmptyState.tsx`
- `frontend/src/components/features/projects/tagManager/useTagGroupOperations.ts`
- `frontend/src/components/features/projects/tagManager/useUnsavedChanges.ts`

Adaptations:
- `ProjectAddUpdateTagsForm` uses SWR's `useGetTagsByProject` to load tags and `mutate` for cache invalidation. In RR7:
  - Load tags via `useFetcher().load(...)` from a resource route, OR
  - Use direct API call `getTagsByProject(orgId, projectId)` in a `useEffect` if client-callable
  - For save: `useFetcher` submitting to route action with intent `updateProjectTags`
- `InputTagsAdmin2` — check if it exists in RR7. If not, it needs migrating too. Read `frontend/src/components/ui/forms/input/InputTagsAdmin2.tsx` and create RR7 version.
- `tagGroupTemplate` — check `frontend/src/projectConfig/tagGroupTemplate.ts` for the template data

Dependencies from earlier tasks: `GenericConfirmModal`, `GenericInputModal` (Task 5), `ScrollArea`, `Modal`, `ModalCloseButton`, `ModalHeader`, `Alert`, `Button`, `ButtonGroup`.

**Step 1:** Read all 6 originals + `InputTagsAdmin2` + `tagGroupTemplate`
**Step 2:** Create hooks first (`use-unsaved-changes`, `use-tag-group-operations`)
**Step 3:** Create UI components (`tag-group-empty-state`, `tag-group-toolbar`, `tag-group-item`)
**Step 4:** Create `project-add-update-tags-form` (the main form)
**Step 5:** Create `InputTagsAdmin2` equivalent if missing
**Step 6:** Run `yarn check`
**Step 7:** Commit: `feat: add tag manager feature`

---

### Task 17: Wire Everything Together + Navigation

**Files:**
- Modify: `frontend_rr7/app/config/navigation.ts` (add projects link)
- Modify: `frontend_rr7/app/routes/user.projects._index.tsx` (ensure all imports resolve)

**What to build:**
- Add "My Projects" to the navigation menu. Read `frontend_rr7/app/config/navigation.ts` to understand the nav structure and add the projects entry.
- Verify all imports in the route file resolve correctly
- Test the full flow: navigate to projects page, see project list, open context menus, create/edit project, manage tags, manage members

**Step 1:** Read `frontend_rr7/app/config/navigation.ts`
**Step 2:** Add projects navigation entry
**Step 3:** Run `yarn check`
**Step 4:** Run `yarn build` to verify full build passes
**Step 5:** Commit: `feat: wire projects page into navigation`

---

### Task 18: Final Integration Verification

**Steps:**
1. Run `yarn check` — must pass clean
2. Run `yarn build` — must pass
3. Manual checklist:
   - [ ] Projects page renders with project list
   - [ ] Stats bar shows project count
   - [ ] Search filter works (appears when >10 projects)
   - [ ] Admin context menu shows all 6 actions
   - [ ] Member context menu shows leave only
   - [ ] Create project modal opens and submits
   - [ ] Edit project modal opens and submits
   - [ ] Manage members modal shows member list
   - [ ] Tag manager modal opens with tag groups
   - [ ] Leave project works with confirmation
4. Commit any final fixes
