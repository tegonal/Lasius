# Component Structure Cleanup — Design

## Problem

The `frontend_rr7/app/` directory has three issues:

1. **Domain-specific components in `components/ui/`** — stats tiles, project empty states, chart implementations that belong in `features/`
2. **`components/features/` vs `features/` ambiguity** — two places for feature code with no clear rule
3. **Domain hooks in global `hooks/`** — booking and calendar hooks sitting alongside truly cross-cutting utilities

## Design

### Three-Tier Architecture

```
app/
├── components/
│   ├── primitives/      # Tier 1: atomic design-system elements (button, input, heading, label, divider)
│   └── ui/              # Tier 2: composed reusable components (modal, form, chart infra, layout)
├── features/            # Tier 3: domain-specific self-contained modules
├── hooks/               # Cross-cutting hooks only
├── stores/              # Global stores
├── types/               # Shared types
├── lib/                 # Utilities, API functions
└── routes/              # Route files
```

### Rules

1. **`primitives/`** — wraps a single HTML/DaisyUI element. No domain nouns.
2. **`ui/`** — composed reusable components. Must not import from `features/`. No domain nouns in filenames.
3. **`features/`** — everything domain-specific. Can import from `primitives/` and `ui/`. Cross-feature imports allowed.
4. **`hooks/`** — only hooks used by 2+ features with no single domain owner.
5. **`components/features/`** — eliminated. All feature code lives in `features/`.

### Moves

#### Domain components out of `ui/` → `features/`

| File | From | To |
|------|------|----|
| `stats-tile.tsx` | `components/ui/charts/` | `features/stats/components/` |
| `stats-tile-hours.tsx` | `components/ui/data-display/` | `features/stats/components/` |
| `stats-tile-number.tsx` | `components/ui/data-display/` | `features/stats/components/` |
| `stats-tile-wrapper.tsx` | `components/ui/data-display/` | `features/stats/components/` |
| `stats-group.tsx` | `components/ui/data-display/` | `features/stats/components/` |
| `month-stream-chart.tsx` | `components/ui/charts/` | `features/stats/components/` |
| `weekly-trend-chart.tsx` | `components/ui/charts/` | `features/stats/components/` |
| `project-stream-chart-impl.tsx` | `components/ui/charts/` | `features/stats/components/` |
| `error-boundary-chart.tsx` | `components/ui/` | `features/stats/components/` |
| `empty-state-members.tsx` | `components/ui/data-display/fetch-state/` | `features/projects/components/` |
| `empty-state-projects.tsx` | `components/ui/data-display/fetch-state/` | `features/projects/components/` |
| `project-last-activity.tsx` | `components/ui/data-display/` | `features/projects/components/` |

#### `components/features/` → `features/`

| Folder | From | To |
|--------|------|----|
| `context-menu/` | `components/features/context-menu/` | `features/context-menu/` |
| `login/` | `components/features/login/` | `features/auth/` |
| `system/` | `components/features/system/` | `features/system/` (absorb) |
| `issue-importers/` | `components/features/issue-importers/` | `features/issue-importers/` |

#### Domain hooks → feature folders

| Hook | From | To |
|------|------|----|
| `use-booking-form-data.ts` | `hooks/` | `features/bookings/hooks/` |
| `use-stop-and-start.ts` | `hooks/` | `features/bookings/hooks/` |
| `use-stop-booking.ts` | `hooks/` | `features/bookings/hooks/` |
| `use-calendar-month.ts` | `hooks/` | `features/calendar/hooks/` |

#### Remaining in `hooks/` (cross-cutting)

- `use-api-proxy.ts`
- `use-layout-loader-data.ts`
- `use-persisted-search-param.ts`
- `use-scroll-pagination.ts`

### After cleanup: `components/features/` is deleted

The folder ceases to exist. All feature code lives under `features/`.

### Import updates

Every moved file requires updating all import paths that reference it. No re-exports or aliases — clean moves only.
