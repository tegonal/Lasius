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

test.describe('Lists pages @smoke', () => {
  test('user lists page loads', async ({ page }) => {
    await page.goto('/user/lists')
    await page.waitForURL(/.*\/user\/lists.*/, { timeout: 15000 })
    await expect(page.getByTestId('lists-page')).toBeVisible({ timeout: 15000 })
  })

  test('user lists filter is visible', async ({ page }) => {
    await page.goto('/user/lists')
    await page.waitForURL(/.*\/user\/lists.*/, { timeout: 15000 })
    await expect(page.getByTestId('lists-filter')).toBeVisible({ timeout: 10000 })
  })

  test('organisation lists page loads', async ({ page }) => {
    await page.goto('/organisation/lists')
    await page.waitForURL(/.*\/organisation\/lists.*/, { timeout: 15000 })
    await expect(page.getByTestId('org-lists-page')).toBeVisible({ timeout: 15000 })
  })
})
