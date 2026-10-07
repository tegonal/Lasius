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

import { expect, type Page, type Request, test } from '@playwright/test'

type ProxyPayload = { body?: { end?: string; start?: string }; method: string; url: string }

const readProxyPayload = (request: Request): ProxyPayload | undefined => {
  if (request.method() !== 'POST' || !request.url().includes('/api/proxy')) return undefined
  try {
    return request.postDataJSON() as ProxyPayload
  } catch {
    return undefined
  }
}

const isAddBookingRequest = (request: Request) => {
  const payload = readProxyPayload(request)
  return (
    payload?.method === 'POST' &&
    /\/user-bookings\/organisations\/[^/]+\/bookings$/.test(payload.url) &&
    Boolean(payload.body?.start?.includes('T00:00:00'))
  )
}

const visibleStopButton = (page: Page) =>
  page.getByTestId('booking-current-stop-btn').locator('visible=true').first()

const openHome = async (page: Page, day?: string) => {
  await page.goto(day ? `/user/home?date=${day}` : '/user/home')
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })
  await page.getByTestId('booking-start-submit-btn').waitFor({ state: 'visible', timeout: 15000 })
}

const localDate = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-')

/** Deletes every booking of the day that starts at the time. An earlier failed run can leave one. */
const deleteBookingsStartingAt = async (page: Page, day: string, time: string) => {
  await openHome(page, day)
  const items = page.locator(`[data-testid="booking-item"][data-booking-start^="${day}T${time}"]`)
  await expect(items.first()).toBeVisible({ timeout: 10000 })

  for (let count = await items.count(); count > 0; count -= 1) {
    await expect(async () => {
      await items.first().getByTestId('booking-ctx-open-btn').click()
      await expect(page.getByTestId('booking-ctx-delete-btn')).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 10000 })
    await page.getByTestId('booking-ctx-delete-btn').click()
    await expect(items).toHaveCount(count - 1, { timeout: 10000 })
  }
}

test('stopping a booking from the previous day adds the part after midnight @crud', async ({
  page,
}) => {
  const startOfRun = new Date()
  // The stop rounds the end down to the minute, so a run at 00:00 or 00:01 adds an empty booking.
  test.skip(
    startOfRun.getHours() === 0 && startOfRun.getMinutes() < 2,
    'The run starts too close to midnight.',
  )

  await openHome(page)

  // The quick start stops a running booking at the new start time, which here lies in the past.
  const runningStop = visibleStopButton(page)
  if (await runningStop.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(async () => {
      if (await runningStop.isVisible()) await runningStop.click()
      await expect(runningStop).toBeHidden({ timeout: 3000 })
    }).toPass({ timeout: 15000 })
  }

  const now = new Date()
  const yesterdayEvening = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 22, 0)
  await page.clock.install({ time: yesterdayEvening })
  await openHome(page)

  const projectInput = page.getByRole('combobox', { name: /project/i })
  const chevron = projectInput
    .locator('xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]')
    .last()
  await expect(async () => {
    if ((await projectInput.getAttribute('aria-expanded')) !== 'true') await chevron.click()
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 15000 })

  if ((await page.locator('[role="option"]').count()) === 0) {
    test.skip()
    return
  }
  await page.locator('[role="option"]').first().click()
  await page.getByTestId('booking-start-submit-btn').click()
  await expect(visibleStopButton(page)).toBeVisible({ timeout: 10000 })

  await page.clock.setSystemTime(new Date())

  const addResponse = page.waitForResponse((response) => isAddBookingRequest(response.request()), {
    timeout: 20000,
  })
  await visibleStopButton(page).click()

  const response = await addResponse
  expect(response.ok()).toBe(true)
  await expect(visibleStopButton(page)).toBeHidden({ timeout: 10000 })

  // The spec user is shared, so remove both halves of the split again.
  await deleteBookingsStartingAt(page, localDate(new Date()), '00:00')
  await deleteBookingsStartingAt(page, localDate(yesterdayEvening), '22:00')
})
