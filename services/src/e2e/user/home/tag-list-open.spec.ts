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

test.describe('Tag list after a project pick @bookings', () => {
  test('the quick start form opens the tag list after a project pick', async ({ page }) => {
    await page.goto('/user/home')
    await page.waitForURL(/\/user\/home/, { timeout: 15000 })

    const projectInput = page.getByRole('combobox', { name: /project/i })
    const chevron = projectInput
      .locator('xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]')
      .last()
    await expect(async () => {
      if ((await projectInput.getAttribute('aria-expanded')) !== 'true') await chevron.click()
      await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 15000 })
    await page.locator('[role="option"]').first().click()

    const tagsInput = page.getByRole('combobox', { name: /tags/i })
    await expect(tagsInput).toBeFocused({ timeout: 5000 })
    await expect(tagsInput).toHaveAttribute('aria-expanded', 'true')
  })

  test('the edit form of an existing booking keeps the tag list closed', async ({ page }) => {
    // A day with bookings in the demo data.
    await page.goto('/user/home?date=2026-10-13')
    const bookingItem = page.getByTestId('booking-item').first()
    if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    await expect(async () => {
      await bookingItem.getByTestId('booking-ctx-open-btn').click()
      await expect(page.getByTestId('booking-ctx-edit-btn')).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 10000 })
    await page.getByTestId('booking-ctx-edit-btn').click()
    await expect(page.getByTestId('booking-form-save-btn')).toBeVisible({ timeout: 5000 })

    const dialog = page.getByTestId('modal-dialog')
    const tagsInput = dialog.getByRole('combobox', { name: /tags/i })
    await expect(tagsInput).toBeVisible()
    // The form moves the focus to the tags input, but the list must stay closed.
    await expect(tagsInput).toBeFocused({ timeout: 5000 })
    await expect(tagsInput).toHaveAttribute('aria-expanded', 'false')
  })
})
