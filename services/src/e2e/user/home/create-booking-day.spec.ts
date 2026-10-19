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

test.describe('Create a booking @bookings', () => {
  test('the form starts on the day that the calendar shows', async ({ page }) => {
    await page.goto('/user/home?date=2026-09-14')
    await page.waitForURL(/date=2026-09-14/, { timeout: 15000 })

    const dialog = page.getByTestId('modal-dialog')
    await expect(async () => {
      await page.getByTestId('booking-create-btn').click()
      await expect(dialog).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    // A day other than today starts at 08:00. The hidden form field holds the ISO start.
    const values = await dialog
      .locator('input')
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))
    expect(values.some((value) => value.startsWith('2026-09-14T08:00'))).toBe(true)
    expect(values).toContain('14.09.2026')
  })
})
