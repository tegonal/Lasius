---
version: 1.5.0
applies: playwright | "@playwright/test"
target: rules
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/tests/**"
  - "**/e2e/**"
  - "**/playwright*"
  - "backend/**"
  - "frontend/**"
  - "**/api/**"
  - "**/routes/**"
tags: [testing, e2e, playwright, selectors, test]
---

# E2E Testing Conventions

## Documentation

| Source | URL | Notes |
|--------|-----|-------|
| Playwright docs | https://playwright.dev/docs/intro | Official docs |
| API reference | https://playwright.dev/docs/api/class-playwright | Full API |
| Best practices | https://playwright.dev/docs/best-practices | Official recommendations |
| Locators | https://playwright.dev/docs/locators | Selector strategies |
| Context7 | `/microsoft/playwright` | Good coverage |
| GitHub | https://github.com/microsoft/playwright | Source, issues |

## Selector Strategy: data-testid

Always prefer `data-testid` attributes over text-based selectors.

### Why
- **Language independent** — tests work regardless of UI locale
- **Refactoring safe** — changing button text won't break tests
- **Clear intent** — test IDs document which elements are testable
- **No strict mode violations** — unique IDs avoid matching multiple elements

### Component Side
```tsx
<Button data-testid="invite-btn">
  {t("invite")}
</Button>

<Dialog data-testid="invite-dialog">
  ...
</Dialog>
```

### Test Side
```typescript
await page.getByTestId("invite-btn").click()
await expect(page.getByTestId("invite-dialog")).toBeVisible()
```

### Naming Convention

Pattern: `{context}-{element}-{descriptor}` in kebab-case:

```tsx
<input data-testid="checkout-input-email" />
<button data-testid="checkout-button-submit" />
<div data-testid="cart-item-{sku}" />
<form data-testid="login-form" />
```

| Part | Purpose | Examples |
|------|---------|---------|
| context | Page/feature area | `checkout`, `cart`, `login`, `product` |
| element | Element type | `input`, `button`, `form`, `list`, `item`, `dialog` |
| descriptor | Specific identifier | `email`, `submit`, `total`, `{sku}` |

### Test IDs Must Be Unique

Every `data-testid` value must be unique within the page. Duplicate test IDs cause strict mode violations and flaky tests. For list items, include a dynamic identifier:

```tsx
// ✅ Unique — SKU makes each item distinct
{items.map(item => <div data-testid={`cart-item-${item.sku}`} />)}

// ❌ Duplicate — every item has the same test ID
{items.map(item => <div data-testid="cart-item" />)}
```

### When to Add Test IDs
- Interactive elements being tested (buttons, links, inputs)
- Dialogs/modals that tests verify
- Lists and their items for data verification
- Empty states for conditional UI testing
- Key headings that tests verify

### When NOT to Use Test IDs
- Elements accessed via unambiguous ARIA roles
- URL-based navigation assertions
- Internal implementation details not under test

## Language-Independent Selectors (i18n Apps)

For apps with translations, avoid text-based selectors entirely:

```typescript
// ✅ Input type selectors (best for forms)
page.locator('input[type="email"]')
page.locator('button[type="submit"]')

// ✅ ARIA roles with regex (case-insensitive)
page.getByRole("navigation", { name: "Main" })
page.getByRole("dialog")
page.getByRole("combobox")   // autocomplete inputs
page.getByRole("listbox")    // dropdown containers
page.getByRole("option")     // dropdown items

// ✅ URL-based assertions (completely language-free)
await expect(page).toHaveURL(/\/dashboard/)
await expect(page).toHaveURL(/\/auth\/signin.*error=1/)

// ✅ href patterns for links
page.locator('a[href*="/auth/signin/email"]')

// ❌ AVOID — breaks when locale changes
page.getByText("Sign in")
page.getByLabel("Password")
page.getByRole("button", { name: "Anmelden" })
```

## Prerequisites Checklist

Before running E2E tests, verify all services are running:

1. **Database/services** — Docker containers or equivalent
2. **Backend API** — server responding on expected port
3. **Frontend** — dev server or build serving on expected port

Most timeout failures in CI are caused by missing prerequisites, not test bugs.

## Test Fixtures Pattern

Create reusable test fixtures for common flows:

```typescript
// fixtures.ts
import { test as base } from "@playwright/test"

export const TEST_USER = { email: "testuser@test.com", password: "test" }

export async function login(page, user = TEST_USER) {
  await page.goto("/auth/signin")
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard|\/journeys/)
}

// Custom fixture for authenticated tests
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    await use(page)
  },
})
```

## Test Tags

Use tags to categorize and selectively run tests:

```typescript
test("should create item", { tag: ["@smoke", "@crud"] }, async ({ page }) => {
  // ...
})
```

```bash
npx playwright test --grep @smoke    # Quick validation
npx playwright test --grep @crud     # CRUD tests only
```

## Test Data Isolation

**Test data persists across runs** — handle both empty and populated states:

```typescript
// ✅ Use unique names with timestamps
const title = `Test Item ${Date.now()}`

// ✅ Clean up in afterEach
test.afterEach(async ({ page }) => {
  await deleteTestItem(page)
})

// ✅ Handle empty vs list states
const addButton = page.getByTestId("add-item-btn")
  .or(page.getByTestId("empty-state-add-btn"))
await addButton.first().click()
```

## API Coverage Rule

Every API endpoint must be covered by an E2E test that exercises it through a real user flow — not by calling the API directly. If a backend change adds or modifies an endpoint, add or update an E2E test that reaches that endpoint through the UI.

```typescript
// ✅ Test the API through the user flow that calls it
test("user creates a journey", async ({ authenticatedPage: page }) => {
  await page.getByTestId("create-journey-btn").click()
  await page.getByTestId("journey-input-title").fill("Test Journey")
  await page.getByTestId("journey-btn-save").click()
  await expect(page.getByTestId("journey-item-Test Journey")).toBeVisible()
})

// ❌ Don't test APIs in isolation — that's integration testing, not E2E
test("POST /api/journeys", async ({ request }) => {
  const res = await request.post("/api/journeys", { data: { title: "Test" } })
  expect(res.status()).toBe(201)
})
```

## Common Pitfalls

- **Strict mode violations** — multiple elements match. Use more specific selectors (`{ name: "Main" }`) or `.first()`/`.nth()`
- **Dialogs** — use `page.getByRole("dialog")` not text selectors
- **Dropdown menus** — use `role="menu"` + `role="menuitem"` hierarchy
- **Flaky waits** — prefer `waitForURL`, `toBeVisible()`, `toBeHidden()` over `waitForTimeout`

## Lasius-Specific Pitfalls

These are recurring patterns discovered during E2E test development for this project. Check every new test against this list.

### LayoutResponsive Duplicates

`LayoutResponsive` renders children **twice** (desktop + mobile). Any `data-testid` inside it resolves to 2 elements. The `.first()` picks the mobile version which may be **hidden**.

```typescript
// ❌ Strict mode violation — 2 elements
await page.getByTestId('booking-current-stop-btn').click()

// ❌ .first() picks hidden mobile element
await expect(page.getByTestId('booking-current-stop-btn').first()).toBeVisible()

// ✅ Filter to visible element first
await expect(
  page.getByTestId('booking-current-stop-btn').locator('visible=true').first()
).toBeVisible()
```

**Affected elements:** `booking-current-stop-btn`, `project-create-btn`, `org-actions-dropdown`, `org-actions-create-btn`, `org-actions-invite-btn`, and any test ID inside `ColumnCenter`/`ColumnRight` or responsive wrappers.

### Toggle Buttons in Retry Loops

When a `toPass()` retry clicks a **toggle** button (chevron, checkbox, combobox button), each retry toggles open→close→open. The state oscillates and the assertion never passes.

```typescript
// ❌ Each retry toggles the dropdown
await expect(async () => {
  await chevronBtn.click()
  await expect(options).toBeVisible({ timeout: 2000 })
}).toPass({ timeout: 15000 })

// ✅ Check state before clicking — only click when closed
await expect(async () => {
  const isExpanded = await combobox.getAttribute('aria-expanded')
  if (isExpanded !== 'true') {
    await chevronBtn.click()
  }
  await expect(options).toBeVisible({ timeout: 3000 })
}).toPass({ timeout: 15000 })
```

### DaisyUI Dropdown Click Timing

DaisyUI dropdowns use `tabIndex` for open/close. Clicking a menu item can fail because the dropdown closes (blur) before the click handler fires.

```typescript
// ❌ Item click may not register
await page.getByTestId('org-actions-dropdown').click()
await page.getByTestId('org-actions-create-btn').click()

// ✅ Wrap open + click + assertion in toPass() retry
await expect(async () => {
  await page.getByTestId('org-actions-dropdown').first().click()
  await page.getByTestId('org-actions-create-btn').first().click()
  await expect(page.getByTestId('org-form-name-input')).toBeVisible({ timeout: 2000 })
}).toPass({ timeout: 15000 })
```

### Headless UI ComboboxButton

The Headless UI `ComboboxButton as="div"` wraps the input but clicking the input doesn't reliably open the dropdown. Click the **chevron `ComboboxButton`** instead — find it via XPath from the combobox input.

```typescript
const combobox = page.getByRole('combobox', { name: /project/i })
const chevron = combobox.locator(
  'xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]'
)
```

### formatISOLocale in Test IDs

`formatISOLocale()` returns full ISO datetime with timezone (e.g. `2026-03-01T00:00:00.000+01:00`). Calendar day test IDs include this full string. Use **starts-with** CSS selector, not exact `getByTestId`.

```typescript
// ❌ Exact match fails — actual ID includes timezone
page.getByTestId('calendar-day-2026-03-01')

// ✅ Starts-with match on date portion
page.locator('[data-testid^="calendar-day-2026-03-01"]')
```

### URL-Encoded Date Params in Assertions

Date params containing `:` and `+` get URL-encoded to `%3A` and `%2B`. Regex assertions against `page.url()` must account for encoding. Compare only the date prefix (YYYY-MM-DD) which has no special characters.

```typescript
// ❌ Fails — ':' and '+' are encoded, '+' is a regex special char
await expect(page).toHaveURL(new RegExp(`date=${dateParam}`))

// ✅ Use date prefix only
const datePrefix = dateParam.slice(0, 10)  // "2026-03-01"
await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`))
```

### Base UI Dialog Selectors

After Base UI migration, modals use `Dialog.Popup` with `role="dialog"`. The old DaisyUI `data-slot="modal"` no longer exists.

```typescript
// ❌ Old DaisyUI pattern
page.locator('[data-slot="modal"]')

// ✅ Base UI Dialog
page.getByRole('dialog')
```

### Navigation via location.href

`globalThis.location.href` assignment inside React onClick handlers doesn't reliably fire in Playwright headless. Use React Router `<Link>` or `useNavigate()` instead. If you encounter a button that doesn't navigate in tests but works manually, check for `location.href` in the handler.

### WebSocket Revalidation Load

Starting/stopping bookings triggers WebSocket events → `revalidator.revalidate()` → re-runs ALL active loaders. Multiple parallel test workers amplify this. The Playwright config limits workers to 2 to reduce backend contention.
