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
 * Starts a booking via quick-start form. Assumes /user/home is loaded.
 */
const startBookingViaQuickStart = async (page: Page) => {
  const projectInput = page.getByRole('combobox', { name: /project/i })
  await projectInput.waitFor({ state: 'visible', timeout: 10000 })

  // The chevron button is the sibling button after the combobox wrapper
  const chevronBtn = projectInput.locator(
    'xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")][last()]',
  )

  await expect(async () => {
    await chevronBtn.click()
    await expect(page.locator('[role="option"]').first()).toBeVisible({
      timeout: 2000,
    })
  }).toPass({ timeout: 15000 })

  const optionCount = await page.locator('[role="option"]').count()
  if (optionCount === 0) return false

  await page.locator('[role="option"]').first().click()
  await page.getByTestId('booking-start-submit-btn').click()
  await expect(page.getByTestId('booking-current-stop-btn').first()).toBeVisible({
    timeout: 10000,
  })
  return true
}

/**
 * Opens the context menu on the running booking.
 */
const openCurrentBookingContextMenu = async (page: Page) => {
  const openBtn = page.getByTestId('booking-current-ctx-open-btn')

  await expect(async () => {
    await openBtn.click()
    await expect(page.getByTestId('booking-current-edit-btn')).toBeVisible({
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })
}

/**
 * Opens the context menu for a favorite item.
 */
const openFavoriteContextMenu = async (page: Page, index = 0) => {
  const favoriteItem = page.getByTestId('favorite-item').nth(index)
  const openBtn = favoriteItem.getByTestId('favorite-ctx-open-btn')

  await expect(async () => {
    await openBtn.click()
    await expect(page.getByTestId('favorite-ctx-start-btn')).toBeVisible({
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })
}

/**
 * Stops the running booking if one exists.
 */
const stopBookingIfRunning = async (page: Page) => {
  const stopBtn = page.getByTestId('booking-current-stop-btn').first()
  if (await stopBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await stopBtn.click()
    await expect(stopBtn).not.toBeVisible({ timeout: 10000 })
  }
}

test.describe.serial('Context menu actions @context-menus', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/user/home')
    await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })
    await page.getByTestId('booking-start-submit-btn').waitFor({ state: 'visible', timeout: 15000 })
  })

  test('edit running booking via context menu', async ({ page }) => {
    // Ensure a booking is running
    const stopBtn = page.getByTestId('booking-current-stop-btn').first()
    if (!(await stopBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      const started = await startBookingViaQuickStart(page)
      if (!started) {
        test.skip()
        return
      }
    }

    await openCurrentBookingContextMenu(page)
    await page.getByTestId('booking-current-edit-btn').click()

    // Edit-running modal should appear with save and close buttons
    await expect(page.getByTestId('booking-edit-running-save-btn')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('booking-edit-running-close-btn')).toBeVisible()

    // Close without saving
    await page.getByTestId('booking-edit-running-close-btn').click()
    await expect(page.getByTestId('booking-edit-running-save-btn')).not.toBeVisible({
      timeout: 5000,
    })
  })

  test('add running booking to favorites via context menu', async ({ page }) => {
    const stopBtn = page.getByTestId('booking-current-stop-btn').first()
    if (!(await stopBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      const started = await startBookingViaQuickStart(page)
      if (!started) {
        test.skip()
        return
      }
    }

    await openCurrentBookingContextMenu(page)
    await page.getByTestId('booking-current-favorite-btn').click()

    // Switch to favorites tab and verify the favorite appeared
    await page.getByTestId('nav-tab-bookingStartFav').click()
    await expect(page.getByTestId('favorite-item').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('stop running booking before favorite tests', async ({ page }) => {
    await stopBookingIfRunning(page)
  })

  test('start booking from favorite via context menu', async ({ page }) => {
    // Switch to favorites tab
    await page.getByTestId('nav-tab-bookingStartFav').click()

    const favoriteItem = page.getByTestId('favorite-item').first()
    if (!(await favoriteItem.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip()
      return
    }

    await openFavoriteContextMenu(page)
    await page.getByTestId('favorite-ctx-start-btn').click()

    // A booking should now be running
    await expect(page.getByTestId('booking-current-stop-btn').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('stop booking before delete favorite', async ({ page }) => {
    await stopBookingIfRunning(page)
  })

  test('delete favorite via context menu', async ({ page }) => {
    // Switch to favorites tab
    await page.getByTestId('nav-tab-bookingStartFav').click()

    const favoriteItems = page.getByTestId('favorite-item')
    const countBefore = await favoriteItems.count()

    if (countBefore === 0) {
      test.skip()
      return
    }

    await openFavoriteContextMenu(page)
    await page.getByTestId('favorite-ctx-delete-btn').click()

    // Wait for the favorite to be removed
    await expect(async () => {
      const countAfter = await favoriteItems.count()
      expect(countAfter).toBeLessThan(countBefore)
    }).toPass({ timeout: 10000 })
  })

  test('start booking from team member via context menu', async ({ page }) => {
    // Switch to team tab
    await page.getByTestId('nav-tab-bookingStartTeam').click()

    // This requires another org member with an active booking — skip if none
    const orgOpenBtn = page.getByTestId('org-ctx-open-btn').first()
    if (!(await orgOpenBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    await expect(async () => {
      await orgOpenBtn.click()
      await expect(page.getByTestId('org-ctx-start-btn')).toBeVisible({
        timeout: 1000,
      })
    }).toPass({ timeout: 10000 })

    await page.getByTestId('org-ctx-start-btn').click()

    // A booking should now be running
    await expect(page.getByTestId('booking-current-stop-btn').first()).toBeVisible({
      timeout: 10000,
    })
  })
})
