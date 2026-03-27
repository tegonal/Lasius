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

See `project/e2e-pitfalls` for Lasius-specific patterns and gotchas.
