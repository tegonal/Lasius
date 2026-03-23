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

test('help button opens help drawer @smoke', async ({ page }) => {
  await page.goto('/user/home')
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

  // Retry click until hydration is complete and drawer appears
  await expect(async () => {
    await page.getByTestId('help-btn').click()
    await expect(page.getByTestId('help-drawer')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
})

test('help drawer can be closed @smoke', async ({ page }) => {
  await page.goto('/user/home')
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

  // Open help (only click if not already open to avoid toggle race)
  await expect(async () => {
    if ((await page.getByTestId('help-drawer').count()) === 0) {
      await page.getByTestId('help-btn').click()
    }
    await expect(page.getByTestId('help-drawer')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })

  // Close help via the close button inside the drawer (modal traps focus so external toggle won't work)
  await page.getByTestId('help-drawer').getByRole('button', { name: /close/i }).click()

  await expect(page.getByTestId('help-drawer')).not.toBeVisible({ timeout: 5000 })
})
