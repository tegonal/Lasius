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

const offlineHealth = JSON.stringify({ backend: 'disconnected', status: 'ok', version: 'dev' })

test.describe('Offline overlay @system', () => {
  test('retries, checks on a click, and closes when the backend is back', async ({ page }) => {
    await page.goto('/user/home')
    await page.waitForURL(/\/user\/home/, { timeout: 15000 })

    // The mock replaces the backend state of /api/health. The real backend keeps running.
    let isOffline = true
    let checkCount = 0
    await page.route('**/api/health', async (route) => {
      checkCount += 1
      if (isOffline) {
        return route.fulfill({ body: offlineHealth, contentType: 'application/json', status: 200 })
      }
      return route.continue()
    })

    // The online event starts a check at once, so the test needs no wait for the poll interval.
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    const overlay = page.getByTestId('backend-offline')
    await expect(overlay).toBeVisible({ timeout: 10000 })

    // The backoff schedules the second check about 2 seconds after the first.
    await expect.poll(() => checkCount, { timeout: 10000 }).toBeGreaterThanOrEqual(2)

    const countBeforeClick = checkCount
    await page.getByTestId('backend-offline-retry-btn').click()
    await expect.poll(() => checkCount, { timeout: 3000 }).toBe(countBeforeClick + 1)
    await expect(overlay).toBeVisible()

    isOffline = false
    await page.getByTestId('backend-offline-retry-btn').click()
    await expect(overlay).toBeHidden({ timeout: 5000 })
  })

  test('a health request that never returns does not block the next check', async ({ page }) => {
    await page.goto('/user/home')
    await page.waitForURL(/\/user\/home/, { timeout: 15000 })

    let hangCount = 0
    let checkCount = 0
    await page.route('**/api/health', async (route) => {
      checkCount += 1
      // The first request never gets an answer.
      if (hangCount === 0) {
        hangCount += 1
        return
      }
      return route.fulfill({ body: offlineHealth, contentType: 'application/json', status: 200 })
    })

    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    // The client aborts the hung request after 5 seconds, reports offline, and checks again.
    await expect(page.getByTestId('backend-offline')).toBeVisible({ timeout: 10000 })
    await expect.poll(() => checkCount, { timeout: 10000 }).toBeGreaterThanOrEqual(2)
  })
})
