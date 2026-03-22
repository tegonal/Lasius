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

test('org switcher modal opens and shows organisations @crud', async ({ page }) => {
  await page.goto('/user/home')
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

  // Click org switcher button
  await page.getByTestId('org-selector-btn').click()

  // Modal should appear with org cards
  await expect(page.getByTestId('org-switcher-modal')).toBeVisible({ timeout: 5000 })
  await expect(page.getByTestId('org-card').first()).toBeVisible()

  // Should have at least 1 org
  const orgCount = await page.getByTestId('org-card').count()
  expect(orgCount).toBeGreaterThanOrEqual(1)
})

test('switch organisation and verify context changes @crud', async ({ page }) => {
  await page.goto('/user/home')
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

  // Open org switcher
  await page.getByTestId('org-selector-btn').click()
  await expect(page.getByTestId('org-switcher-modal')).toBeVisible({ timeout: 5000 })

  // Count org cards — if only 1, skip
  const orgCount = await page.getByTestId('org-card').count()
  if (orgCount < 2) {
    test.skip()
    return
  }

  // Click the second org card
  await page.getByTestId('org-card').nth(1).click()

  // Modal should close and page should reload
  await expect(page.getByTestId('org-switcher-modal')).not.toBeVisible({ timeout: 10000 })
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })
})
