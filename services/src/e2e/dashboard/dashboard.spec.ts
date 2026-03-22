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

test.describe('Dashboard', () => {
  test('loads after login @smoke', async ({ page }) => {
    await page.goto('/', { timeout: 15000 })

    // Verify redirected to authenticated user area
    await expect(page).toHaveURL(/\/user\//, { timeout: 15000 })

    // Verify calendar week navigation buttons are visible
    await expect(page.getByTestId('calendar-week-prev-btn').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('calendar-week-next-btn').first()).toBeVisible()
  })

  test('calendar week navigation works @smoke', async ({ page }) => {
    await page.goto('/user/home', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\//, { timeout: 15000 })

    // Wait for calendar to load
    const prevBtn = page.getByTestId('calendar-week-prev-btn').first()
    await expect(prevBtn).toBeVisible({ timeout: 10000 })

    // Click previous week
    await prevBtn.click()

    // Click next week
    const nextBtn = page.getByTestId('calendar-week-next-btn').first()
    await nextBtn.click()

    // Click today button (visible when not on current day after navigation)
    const todayBtn = page.getByTestId('calendar-week-today-btn').first()
    if (await todayBtn.isVisible()) {
      await todayBtn.click()
    }
  })

  test('dashboard period tabs navigate correctly @smoke', async ({ page }) => {
    await page.goto('/user/dashboard', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\/dashboard/, { timeout: 15000 })

    // Wait for tabs to load
    const dayTab = page.getByTestId('dashboard-tab-day')
    await expect(dayTab).toBeVisible({ timeout: 10000 })

    // Click through each period tab and verify URL changes
    await page.getByTestId('dashboard-tab-week').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/week/, { timeout: 10000 })

    await page.getByTestId('dashboard-tab-month').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/month/, { timeout: 10000 })

    await page.getByTestId('dashboard-tab-6months').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/6months/, {
      timeout: 10000,
    })

    await page.getByTestId('dashboard-tab-year').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/year/, { timeout: 10000 })

    await page.getByTestId('dashboard-tab-day').click()
    await expect(page).toHaveURL(/\/user\/dashboard\/day/, { timeout: 10000 })
  })

  test('navigation tabs visible @smoke', async ({ page }) => {
    await page.goto('/user/home', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\//, { timeout: 15000 })

    // Verify main navigation tabs are visible
    await expect(page.getByTestId('nav-tab-user').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('nav-tab-organisation').first()).toBeVisible()
    await expect(page.getByTestId('nav-tab-settings').first()).toBeVisible()
  })

  test('navigation to projects page @smoke', async ({ page }) => {
    await page.goto('/user/home', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\//, { timeout: 15000 })

    // Wait for nav to load
    await expect(page.getByTestId('nav-tab-user').first()).toBeVisible({ timeout: 10000 })

    // The nav tabs are section-level (user, organisation, settings)
    // The "user" section should already be active on /user/home
    // Projects is a sub-item within the user section, navigated via route links
    // Navigate to projects page directly
    await page.goto('/user/projects', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\/projects/, { timeout: 10000 })
  })
})
