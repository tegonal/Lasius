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

test.describe('Booking lifecycle @crud', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/user/home')
    await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })
    // Wait for page to load
    await page.getByTestId('calendar-week-prev-btn').waitFor({ state: 'visible', timeout: 15000 })
  })

  test('start a booking from quick start form', async ({ page }) => {
    // The booking start form has a project select — click it and pick first option
    await page.getByTestId('booking-start-submit-btn').waitFor({ state: 'visible', timeout: 10000 })

    // Select a project - the form has a combobox/select for projects
    // Click the project select area (look for a combobox or select input)
    const projectSelect = page.locator('[name="projectId"]').first()
    if (await projectSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectSelect.click()
      // Pick first option
      await page.locator('[role="option"]').first().click({ timeout: 5000 })
    }

    await page.getByTestId('booking-start-submit-btn').click()

    // Running booking should appear
    await expect(page.getByTestId('booking-current-stop-btn')).toBeVisible({ timeout: 10000 })
  })

  test('stop a running booking', async ({ page }) => {
    const stopBtn = page.getByTestId('booking-current-stop-btn')

    // Skip if no booking is running
    if (!(await stopBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    await stopBtn.click()

    // After stopping, a booking-item should be in the list
    await expect(page.getByTestId('booking-item').first()).toBeVisible({ timeout: 10000 })
  })

  test('edit a booking via context menu', async ({ page }) => {
    const bookingItem = page.getByTestId('booking-item').first()
    if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Open context menu
    await bookingItem.getByTestId('booking-ctx-open-btn').click()

    // Click edit
    await page.getByTestId('booking-ctx-edit-btn').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('booking-ctx-edit-btn').click()

    // Edit form modal should appear
    await expect(page.getByTestId('booking-form-save-btn')).toBeVisible({ timeout: 5000 })

    // Close without saving
    await page.getByTestId('booking-form-close-btn').click()
    await expect(page.getByTestId('booking-form-save-btn')).not.toBeVisible({ timeout: 5000 })
  })

  test('delete a booking via context menu', async ({ page }) => {
    const bookingItems = page.getByTestId('booking-item')
    const countBefore = await bookingItems.count()

    if (countBefore === 0) {
      test.skip()
      return
    }

    // Open context menu on first booking
    await bookingItems.first().getByTestId('booking-ctx-open-btn').click()

    // Click delete
    await page.getByTestId('booking-ctx-delete-btn').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('booking-ctx-delete-btn').click()

    // Wait for deletion to process and verify count decreased
    await page.waitForTimeout(2000)
    const countAfter = await bookingItems.count()
    expect(countAfter).toBeLessThan(countBefore)
  })

  test('start booking from context menu', async ({ page }) => {
    const bookingItem = page.getByTestId('booking-item').first()
    if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    await bookingItem.getByTestId('booking-ctx-open-btn').click()

    await page.getByTestId('booking-ctx-start-btn').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('booking-ctx-start-btn').click()

    // Running booking should appear
    await expect(page.getByTestId('booking-current-stop-btn')).toBeVisible({ timeout: 10000 })
  })

  test('add booking to favorites via context menu', async ({ page }) => {
    const bookingItem = page.getByTestId('booking-item').first()
    if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    await bookingItem.getByTestId('booking-ctx-open-btn').click()

    await page.getByTestId('booking-ctx-favorite-btn').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('booking-ctx-favorite-btn').click()

    // Favorite should appear in favorites list
    await expect(page.getByTestId('favorite-item').first()).toBeVisible({ timeout: 10000 })
  })
})
