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

test.describe('Bookings date cache @calendar', () => {
  test('a day that was shown before loads without a server request', async ({ page }) => {
    // A Monday, because the week buttons select the Monday of the new week.
    // The URL needs a date, or the page restores the last stored date.
    await page.goto('/user/home?date=2026-09-14')
    await page.waitForURL(/\/user\/home\?date=2026-09-14/, { timeout: 15000 })

    const homeDataRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/user/home.data')) homeDataRequests.push(request.url())
    })

    const next = page.getByTestId('calendar-week-next-btn').locator('visible=true').first()
    const previous = page.getByTestId('calendar-week-prev-btn').locator('visible=true').first()
    const startUrl = page.url()

    // The first visit of the next week loads from the server. A click can land before hydration.
    await expect(async () => {
      await next.click()
      await expect(page).not.toHaveURL(startUrl, { timeout: 2000 })
    }).toPass({ timeout: 15000 })
    await expect.poll(() => homeDataRequests.length, { timeout: 10000 }).toBeGreaterThanOrEqual(1)

    // The start day came from the server render, which the cache does not hold, so it loads once.
    const nextUrl = page.url()
    await previous.click()
    await expect(page).toHaveURL(startUrl)
    await page.waitForLoadState('networkidle')

    // The next week was loaded by a client navigation, so it comes from the cache.
    const countBeforeRevisit = homeDataRequests.length
    await next.click()
    await expect(page).toHaveURL(nextUrl)
    await page.waitForLoadState('networkidle')
    expect(homeDataRequests.length).toBe(countBeforeRevisit)
  })
})
