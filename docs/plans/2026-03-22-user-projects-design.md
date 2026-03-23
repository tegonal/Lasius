# User/Projects Migration Design

## Overview

Migrate the user/projects page from Next.js (`frontend/`) to React Router 7 (`frontend_rr7/`). This is a 1:1 replica — same visual design, same functionality, framework layer adapted.

## Route Structure

```
app/routes/user.projects.tsx        → Layout route
app/routes/user.projects._index.tsx → Page content
```

## Feature Directories

```
app/features/projects/              → Project list, stats, forms, members
app/features/tag-manager/           → Tag groups, simple tags, tag operations
app/features/context-menu/          → Shared context menu system
```

## Components

### Route Files

| File | Purpose |
|------|---------|
| `user.projects.tsx` | Layout route with loader (fetches user projects) |
| `user.projects._index.tsx` | Renders MyProjectsLayout |

### Feature: Projects (`app/features/projects/`)

| Component | Migrated from |
|-----------|---------------|
| `components/my-projects-layout.tsx` | `myProjectsLayout.tsx` |
| `components/my-projects-list.tsx` | `myProjectsList.tsx` |
| `components/my-projects-stats.tsx` | `myProjectsStats.tsx` |
| `components/my-projects-right-column.tsx` | `myProjectsRightColumn.tsx` |
| `components/my-projects-list-item-admin-context.tsx` | `myProjectsListItemAdministratorContext.tsx` |
| `components/my-projects-list-item-member-context.tsx` | `myProjectsListItemMemberContext.tsx` |
| `components/project-add-update-form.tsx` | `projectAddUpdateForm.tsx` |
| `components/manage-members.tsx` | `manageMembers.tsx` |
| `components/project-members-list.tsx` | `projectMembersList.tsx` |
| `components/project-member-list-item-context.tsx` | `projectMemberListItemContext.tsx` |
| `components/manage-project-members-stats.tsx` | `manageProjectMembersStats.tsx` |
| `hooks/use-projects.ts` | `useProjects` — wraps loader data access |

### Feature: Tag Manager (`app/features/tag-manager/`)

| Component | Migrated from |
|-----------|---------------|
| `components/project-add-update-tags-form.tsx` | `projectAddUpdateTagsForm.tsx` |
| `components/tag-group-item.tsx` | `tagManager/TagGroupItem.tsx` |
| `components/tag-group-toolbar.tsx` | `tagManager/TagGroupToolbar.tsx` |
| `components/tag-group-empty-state.tsx` | `tagManager/TagGroupEmptyState.tsx` |
| `hooks/use-tag-group-operations.ts` | `tagManager/useTagGroupOperations.ts` |
| `hooks/use-unsaved-changes.ts` | `tagManager/useUnsavedChanges.ts` |

### Feature: Context Menu (`app/features/context-menu/`)

| Component | Migrated from |
|-----------|---------------|
| `context-body.tsx` | `contextBody.tsx` |
| `context-bar.tsx` | `contextBar.tsx` |
| `context-bar-divider.tsx` | `contextBarDivider.tsx` |
| `context-button-wrapper.tsx` | `contextButtonWrapper.tsx` |
| `context-animate-presence.tsx` | `contextAnimatePresence.tsx` |
| `buttons/context-button-open.tsx` | `contextButtonOpen.tsx` |
| `buttons/context-button-close.tsx` | `contextButtonClose.tsx` |
| `buttons/context-button-leave-project.tsx` | `contextButtonLeaveProject.tsx` |
| `hooks/use-context-menu.ts` | `useContextMenu.ts` |

### Shared UI Components to Create

| Component | Path |
|-----------|------|
| DataList, DataListRow, DataListField, DataListHeaderItem | `app/components/ui/data-display/data-list/` |
| StatsGroup | `app/components/ui/data-display/stats-group.tsx` |
| StatsTileNumber | `app/components/ui/data-display/stats-tile-number.tsx` |
| AvatarProject | `app/components/ui/data-display/avatar/avatar-project.tsx` |
| EmptyStateProjects | `app/components/ui/data-display/fetch-state/empty-state-projects.tsx` |
| EmptyStateMembers | `app/components/ui/data-display/fetch-state/empty-state-members.tsx` |
| ProjectLastActivity | `app/components/ui/data-display/project-last-activity.tsx` |

## Framework Adaptations

### Data Loading (SWR → Loaders + Fetchers)

- **Project list data**: Route loader fetches from API, accessed via `useLoaderData`/`useRouteLoaderData`
- **Mutations** (create/update/delete): `useFetcher` submitting to route actions
- **Revalidation**: Automatic after fetcher actions complete (RR7 built-in)
- **`useProjects` hook**: Wraps loader data access instead of SWR

### Other Adaptations

- `next-i18next` → `react-i18next` (same `useTranslation` API)
- `next/router` → `useNavigate` from `react-router`
- `useIsClient` → not needed (RR7 client components)
- Arrow function components throughout (project convention)

## No Changes To

- Business logic, validation schemas, error handling
- Visual structure, CSS classes, responsive behavior
- API function signatures (Orval-generated)
