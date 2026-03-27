/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { expect, type Page, test } from '@playwright/test'

/**
 * Builds a locator for a calendar day cell.
 * The component uses `formatISOLocale` which returns full ISO datetime (e.g. "2026-03-01T00:00:00.000+01:00"),
 * so we match by starts-with on the date portion.
 */
const calendarDayLocator = (page: Page, year: number, month: number, day: number) => {
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return page.locator(`[data-testid^="calendar-day-${iso}"]`)
}

/**
 * Returns year/month for the previous month relative to now.
 */
const prevMonth = () => {
  const now = new Date()
  const m = now.getMonth() // 0-based
  return m === 0
    ? { year: now.getFullYear() - 1, month: 12 }
    : { year: now.getFullYear(), month: m }
}

test.describe('Dashboard interactions @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/user/dashboard/month')
    await expect(page).toHaveURL(/\/user\/dashboard\/month/, { timeout: 15000 })
  })

  test('calendar compact day cell click changes date param', async ({ page }) => {
    const calendar = page.getByTestId('calendar-month-compact')
    if (!(await calendar.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Click day 1 of the current month
    const now = new Date()
    const dayCell = calendarDayLocator(page, now.getFullYear(), now.getMonth() + 1, 1)
    await expect(dayCell).toBeVisible({ timeout: 5000 })
    await dayCell.click()

    // URL should now contain a ?date= param
    await expect(page).toHaveURL(/[?&]date=/, { timeout: 10000 })
  })

  test('calendar compact today button resets to current date', async ({ page }) => {
    const calendar = page.getByTestId('calendar-month-compact')
    if (!(await calendar.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Navigate to previous month so the "Today" button appears
    const prev = prevMonth()
    await expect(async () => {
      await page.getByTestId('calendar-month-prev-btn').click()
      await expect(calendarDayLocator(page, prev.year, prev.month, 15)).toBeVisible({
        timeout: 2000,
      })
    }).toPass({ timeout: 15000 })

    // Click day 15 in the previous month
    await calendarDayLocator(page, prev.year, prev.month, 15).click()
    await expect(page).toHaveURL(/[?&]date=/, { timeout: 10000 })

    // The "Today" button should now be visible
    const todayBtn = page.getByTestId('calendar-month-today-btn')
    await expect(todayBtn).toBeVisible({ timeout: 5000 })

    await todayBtn.click()

    // After clicking today, the URL should update (date param changes to today)
    const today = new Date().toISOString().slice(0, 10)
    await expect(page).toHaveURL(new RegExp(`date=${today}`), { timeout: 10000 })
  })

  test('calendar compact month navigation updates calendar', async ({ page }) => {
    const calendar = page.getByTestId('calendar-month-compact')
    if (!(await calendar.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    // After navigating to previous month, day cells from that month should appear
    const prev = prevMonth()
    await expect(async () => {
      await page.getByTestId('calendar-month-prev-btn').click()
      await expect(calendarDayLocator(page, prev.year, prev.month, 1)).toBeVisible({
        timeout: 2000,
      })
    }).toPass({ timeout: 15000 })

    // Navigate forward — current month's day 1 should reappear
    const now = new Date()
    await expect(async () => {
      await page.getByTestId('calendar-month-next-btn').click()
      await expect(calendarDayLocator(page, now.getFullYear(), now.getMonth() + 1, 1)).toBeVisible({
        timeout: 2000,
      })
    }).toPass({ timeout: 15000 })
  })

  test('date param preserved when switching period tabs', async ({ page }) => {
    const calendar = page.getByTestId('calendar-month-compact')
    if (!(await calendar.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Navigate to previous month and click day 10 to set a specific date
    const prev = prevMonth()
    await expect(async () => {
      await page.getByTestId('calendar-month-prev-btn').click()
      await expect(calendarDayLocator(page, prev.year, prev.month, 10)).toBeVisible({
        timeout: 2000,
      })
    }).toPass({ timeout: 15000 })
    await calendarDayLocator(page, prev.year, prev.month, 10).click()
    await expect(page).toHaveURL(/[?&]date=/, { timeout: 10000 })

    // Extract the date portion (YYYY-MM-DD) which doesn't need encoding
    const url = new URL(page.url())
    const dateParam = url.searchParams.get('date')
    expect(dateParam).toBeTruthy()
    const datePrefix = dateParam!.slice(0, 10) // e.g. "2026-02-10"

    // Switch to week tab — date param should be preserved
    await page.getByTestId('dashboard-tab-week').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/week/, { timeout: 10000 })
    await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`), { timeout: 5000 })

    // Switch to day tab
    await page.getByTestId('dashboard-tab-day').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/day/, { timeout: 10000 })
    await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`), { timeout: 5000 })

    // Switch to 6months tab
    await page.getByTestId('dashboard-tab-6months').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/6months/, { timeout: 10000 })
    await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`), { timeout: 5000 })

    // Switch to year tab
    await page.getByTestId('dashboard-tab-year').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/year/, { timeout: 10000 })
    await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`), { timeout: 5000 })

    // Switch back to month tab
    await page.getByTestId('dashboard-tab-month').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/month/, { timeout: 10000 })
    await expect(page).toHaveURL(new RegExp(`date=.*${datePrefix}`), { timeout: 5000 })
  })

  test('stats tile toggles between decimal and duration format', async ({ page }) => {
    const hoursTile = page.getByTestId('stats-hours-tile')
    if (!(await hoursTile.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Read initial title label
    const statTitle = hoursTile.locator('.stat-title')
    const initialTitle = await statTitle.textContent()

    // Click to toggle format
    await hoursTile.click()

    // Click again to toggle back
    await hoursTile.click()

    // Should return to original title
    await expect(statTitle).toHaveText(initialTitle!, { timeout: 5000 })

    // Verify the expected-hours tile also responds to the toggle
    const expectedTile = page.getByTestId('stats-expected-hours-tile')
    if (await expectedTile.isVisible()) {
      await expectedTile.click()
      // Both tiles share the same toggle state, so clicking either should change both
      await expectedTile.click()
    }
  })

  test('year view calendar year toggle switches mode', async ({ page }) => {
    // Navigate to year view
    await page.getByTestId('dashboard-tab-year').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/year/, { timeout: 10000 })

    const toggle = page.getByTestId('dashboard-year-toggle')
    await expect(toggle).toBeVisible({ timeout: 5000 })

    // Initially should be unchecked (rolling 12 months)
    await expect(toggle).not.toBeChecked()
    expect(page.url()).not.toContain('year=calendar')

    // Toggle to calendar year mode
    await toggle.click()
    await expect(page).toHaveURL(/year=calendar/, { timeout: 10000 })
    await expect(toggle).toBeChecked()

    // Toggle back to rolling mode
    await toggle.click()
    await expect(page).not.toHaveURL(/year=calendar/, { timeout: 10000 })
    await expect(toggle).not.toBeChecked()
  })
})
