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

import { expect, test } from '@playwright/test'

test.describe('Calendar views @calendar', () => {
  test('dashboard day view loads', async ({ page }) => {
    await page.goto('/user/dashboard/day')
    await page.waitForURL(/.*\/user\/dashboard\/day.*/, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('dashboard week view loads', async ({ page }) => {
    await page.goto('/user/dashboard/week')
    await page.waitForURL(/.*\/user\/dashboard\/week.*/, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('dashboard month view loads', async ({ page }) => {
    await page.goto('/user/dashboard/month')
    await page.waitForURL(/.*\/user\/dashboard\/month.*/, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('dashboard 6months view loads', async ({ page }) => {
    await page.goto('/user/dashboard/6months')
    await page.waitForURL(/.*\/user\/dashboard\/6months.*/, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('dashboard year view loads', async ({ page }) => {
    await page.goto('/user/dashboard/year')
    await page.waitForURL(/.*\/user\/dashboard\/year.*/, { timeout: 15000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('calendar month compact navigation', async ({ page }) => {
    await page.goto('/user/dashboard')
    await page.waitForURL(/.*\/user\/dashboard.*/, { timeout: 15000 })

    const monthCompact = page.getByTestId('calendar-month-compact')
    if (await monthCompact.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.getByTestId('calendar-month-prev-btn').click()
      await page.getByTestId('calendar-month-next-btn').click()
    }
  })
})
