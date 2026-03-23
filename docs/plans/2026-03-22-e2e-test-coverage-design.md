# E2E Test Coverage Design

## Goal

Complete E2E test coverage for the frontend_rr7 app. Every button pressed, every context menu option opened, every filter tested.

## Test Organization

Tests organized in subdirectories mirroring app routes:

```
services/src/e2e/
├── auth/
│   ├── auth.setup.ts                   # internal auth state (moved)
│   ├── auth-keycloak.setup.ts          # keycloak auth state (moved)
│   ├── login.unauth.spec.ts            # login flow (moved)
│   ├── register.unauth.spec.ts         # NEW — registration flow
│   ├── logout.spec.ts                  # logout (moved)
│   ├── protected-routes.unauth.spec.ts # route protection (moved)
│   └── error.unauth.spec.ts           # auth errors (moved)
├── dashboard/
│   └── dashboard.spec.ts              # NEW — dashboard landing
├── user/
│   ├── home/
│   │   ├── bookings.spec.ts           # NEW — start, stop, edit, delete
│   │   └── calendar.spec.ts           # NEW — view switching, navigation
│   ├── projects/
│   │   └── projects.spec.ts           # NEW — CRUD, members, tags, context menus
│   ├── stats/
│   │   └── stats.spec.ts             # NEW — filters, charts, export
│   └── lists/
│       └── lists.spec.ts             # NEW — booking history, filters
├── organisation/
│   ├── invite.spec.ts                 # org invitations (moved)
│   ├── invite-keycloak.spec.ts        # keycloak invitations (moved)
│   └── switching.spec.ts             # NEW — org switching
├── help/
│   └── help-menu.spec.ts            # NEW — help menu interactions
├── smoke.spec.ts                     # smoke test (stays at root)
└── smoke-keycloak.spec.ts            # keycloak smoke (stays at root)
```

## Test Data Strategy

**Hybrid approach:**
- Seeded demo data (`demo1@lasius.ch`, `demo2@lasius.ch`) for bookings, stats, calendar, org switching
- Fresh data created via UI for project CRUD tests
- No explicit teardown — demo data is stable across dev setup resets

## Selector Strategy

- `data-testid` attributes exclusively (language-independent, per project conventions)
- Added incrementally to frontend_rr7 components as tests are written
- Naming: `feature-component-action` (e.g., `booking-start-btn`, `project-card-delete-btn`)

## Implementation Phases

### Phase 1: Auth — Login + Registration
- Move existing auth tests into `auth/` subdirectory
- Update playwright.config.ts setup project paths
- Add `register.unauth.spec.ts`: valid registration, validation errors, duplicate email
- Add missing `data-testid` to registration form fields

### Phase 2: Dashboard
- Verify dashboard loads post-login (calendar, booking panel visible)
- Verify current date highlighted
- Verify favorites section renders

### Phase 3: Bookings
- Start a booking (select project from favorites/search)
- Verify running booking indicator
- Stop the booking
- Verify booking in day list
- Edit booking (change times, tags)
- Delete booking via context menu

### Phase 4: Org Switching
- Open org selector
- Switch to second demo org
- Verify dashboard reloads with new org context
- Switch back

### Phase 5: Projects
- List projects page loads
- Create new project via modal
- Edit project (rename)
- Add/remove members
- Manage tags
- Context menu actions (leave project)
- Delete project

### Phase 6: Help Menu
- Open help menu
- Verify menu items visible
- Close help menu

### Phase 7: Calendar
- Switch between day, week, month, 6-month, year views
- Navigate forward/backward
- Verify bookings on correct dates

### Phase 8: Stats + Lists
- Navigate to stats page
- Apply date range filter
- Apply project/user filters
- Verify charts render
- Test export functionality
- Booking history list with filters
