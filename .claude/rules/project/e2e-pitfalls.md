---
version: 1.0.0
applies: playwright | "@playwright/test" | e2e
target: rules
paths:
  - "**/*.spec.*"
  - "**/e2e/**"
  - "**/playwright*"
  - "frontend_rr7/**"
  - "services/**"
tags: [testing, e2e, playwright, lasius]
---

# Lasius E2E Pitfalls

Recurring patterns discovered during E2E test development. Check every new test against this list.

## LayoutResponsive Duplicates

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

## Toggle Buttons in Retry Loops

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

## DaisyUI Dropdown Click Timing

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

## Headless UI ComboboxButton

The Headless UI `ComboboxButton as="div"` wraps the input but clicking the input doesn't reliably open the dropdown. Click the **chevron `ComboboxButton`** instead — find it via XPath from the combobox input.

```typescript
const combobox = page.getByRole('combobox', { name: /project/i })
const chevron = combobox.locator(
  'xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]'
)
```

## formatISOLocale in Test IDs

`formatISOLocale()` returns full ISO datetime with timezone (e.g. `2026-03-01T00:00:00.000+01:00`). Calendar day test IDs include this full string. Use **starts-with** CSS selector, not exact `getByTestId`.

```typescript
// ❌ Exact match fails — actual ID includes timezone
page.getByTestId('calendar-day-2026-03-01')

// ✅ Starts-with match on date portion
page.locator('[data-testid^="calendar-day-2026-03-01"]')
```

## URL-Encoded Date Params in Assertions

Date params containing `:` and `+` get URL-encoded to `%3A` and `%2B`. Regex assertions against `page.url()` must account for encoding. Compare only the date prefix (YYYY-MM-DD) which has no special characters.

```typescript
// ❌ Fails — ':' and '+' are encoded, '+' is a regex special char
await expect(page).toHaveURL(new RegExp(`date=${dateParam}`))

// ✅ Use date prefix only
const datePrefix = dateParam.slice(0, 10)  // "2026-03-01"
await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`))
```

## Base UI Dialog Selectors

After Base UI migration, modals use `Dialog.Popup` with `role="dialog"`. The old DaisyUI `data-slot="modal"` no longer exists.

```typescript
// ❌ Old DaisyUI pattern
page.locator('[data-slot="modal"]')

// ✅ Base UI Dialog
page.getByRole('dialog')
```

## Navigation via location.href

`globalThis.location.href` assignment inside React onClick handlers doesn't reliably fire in Playwright headless. Use React Router `<Link>` or `useNavigate()` instead. If you encounter a button that doesn't navigate in tests but works manually, check for `location.href` in the handler.

## WebSocket Revalidation Load

Starting/stopping bookings triggers WebSocket events → `revalidator.revalidate()` → re-runs ALL active loaders. Multiple parallel test workers amplify this. The Playwright config limits workers to 2 to reduce backend contention.
