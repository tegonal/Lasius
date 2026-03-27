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
 * Opens the context menu for a booking item by clicking the ⋮ button.
 * Retries the click until the menu actually appears (handles SSR hydration timing).
 */
const openContextMenu = async (page: Page, bookingItemIndex = 0) => {
  const bookingItem = page.getByTestId('booking-item').nth(bookingItemIndex)
  const openBtn = bookingItem.getByTestId('booking-ctx-open-btn')

  await expect(async () => {
    await openBtn.click()
    await expect(page.getByTestId('booking-ctx-edit-btn')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 10000 })
}

test.describe.serial('Booking lifecycle @crud', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/user/home')
    await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })
    // Wait for page content to load
    await page.getByTestId('booking-start-submit-btn').waitFor({ state: 'visible', timeout: 15000 })
  })

  test('start a booking from quick start form', async ({ page }) => {
    // Open the project dropdown via the chevron button next to the combobox
    const projectInput = page.getByRole('combobox', { name: /project/i })
    await projectInput.waitFor({ state: 'visible', timeout: 10000 })

    // The chevron button is the sibling button after the combobox wrapper
    const chevronBtn = projectInput.locator(
      'xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")][last()]',
    )

    // Use retry pattern — click chevron to toggle dropdown open
    await expect(async () => {
      await chevronBtn.click()
      await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    // Skip if no project options available (e.g. user is in an E2E-created org)
    const optionCount = await page.locator('[role="option"]').count()
    if (optionCount === 0) {
      test.skip()
      return
    }

    await page.locator('[role="option"]').first().click()

    await page.getByTestId('booking-start-submit-btn').click()

    // Running booking should appear
    await expect(page.getByTestId('booking-current-stop-btn').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('stop a running booking', async ({ page }) => {
    const stopBtn = page.getByTestId('booking-current-stop-btn').first()

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

    await openContextMenu(page)

    // Click edit
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

    await openContextMenu(page)

    // Click delete
    await page.getByTestId('booking-ctx-delete-btn').click()

    // Wait for the UI to reflect the deletion
    await expect(async () => {
      const countAfter = await bookingItems.count()
      expect(countAfter).toBeLessThan(countBefore)
    }).toPass({ timeout: 10000 })
  })

  test('start booking from context menu', async ({ page }) => {
    const bookingItem = page.getByTestId('booking-item').first()
    if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    await openContextMenu(page)

    await page.getByTestId('booking-ctx-start-btn').click()

    // Running booking should appear
    await expect(page.getByTestId('booking-current-stop-btn').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('add booking to favorites via context menu', async ({ page }) => {
    const bookingItem = page.getByTestId('booking-item').first()
    if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    await openContextMenu(page)

    await page.getByTestId('booking-ctx-favorite-btn').click()

    // Switch to favorites tab and check the favorite appeared
    await page.getByTestId('nav-tab-bookingStartFav').click()
    await expect(page.getByTestId('favorite-item').first()).toBeVisible({ timeout: 10000 })
  })
})
