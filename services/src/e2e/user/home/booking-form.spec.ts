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

import { expect, type Locator, type Page, test } from '@playwright/test'

type Saved = { end: string; project: string; start: string }

const dialog = (page: Page) => page.locator('[role="dialog"]').last()

/** Reads the HH:mm part of a form time value such as 2026-10-07T09:15:00.000+02:00. */
const timeOf = async (input: Locator) =>
  ((await input.inputValue()).match(/T(\d\d:\d\d)/) ?? [])[1] ?? ''

const pickFirstProject = async (page: Page) => {
  const input = dialog(page).getByRole('combobox', { name: /proje/i })
  const chevron = input
    .locator('xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]')
    .last()
  await expect(async () => {
    if ((await input.getAttribute('aria-expanded')) !== 'true') await chevron.click()
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15000 })
  // bookings.spec.ts takes the first project, so the last one keeps the rows of both specs apart.
  const option = page.locator('[role="option"]').last()
  const label = (await option.innerText()).trim()
  await option.click()
  return label
}

/** Saves the open form and returns what it saved, so the test can find and delete the booking. */
const saveForm = async (page: Page, project: string): Promise<Saved> => {
  const form = dialog(page)
  const saved = {
    end: await timeOf(form.locator('input[name="end"]')),
    project,
    start: await timeOf(form.locator('input[name="start"]')),
  }
  await page.getByTestId('booking-form-save-btn').click()
  await expect(page.getByTestId('booking-form-save-btn')).toBeHidden({ timeout: 10000 })
  return saved
}

const bookingRow = (page: Page, saved: Saved) =>
  page
    .getByTestId('booking-item')
    .filter({ hasText: saved.project })
    .filter({ hasText: saved.start })
    .filter({ hasText: saved.end })
    .first()

const openRowMenu = async (page: Page, row: Locator, action: string) => {
  await expect(async () => {
    await row.getByTestId('booking-ctx-open-btn').click()
    await expect(page.getByTestId(action)).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 10000 })
  await page.getByTestId(action).click()
}

const deleteBooking = async (page: Page, saved: Saved) => {
  const row = bookingRow(page, saved)
  // Two matching rows mean another spec saved the same booking in the same minute. Keep both.
  const matches = page
    .getByTestId('booking-item')
    .filter({ hasText: saved.project })
    .filter({ hasText: saved.start })
    .filter({ hasText: saved.end })
  if ((await matches.count()) !== 1) return
  await openRowMenu(page, row, 'booking-ctx-delete-btn')
  const confirm = page.getByTestId('confirm-modal-confirm-btn')
  if (await confirm.isVisible({ timeout: 1000 }).catch(() => false)) await confirm.click()
  await expect(matches).toHaveCount(0, { timeout: 10000 })
}

test.describe('Booking add and edit form', () => {
  // Both tests create a booking with the same default times, so they must not run at once.
  test.describe.configure({ mode: 'serial' })
  const created: Saved[] = []

  test.beforeEach(async ({ page }) => {
    await page.goto('/user/home')
    await expect(page.getByTestId('booking-create-btn')).toBeVisible({ timeout: 15000 })
  })

  test.afterEach(async ({ page }) => {
    await page.goto('/user/home')
    for (const saved of created.splice(0)) await deleteBooking(page, saved)
  })

  test('a new booking ends now, starts an hour before, and saves', async ({ page }) => {
    await expect(async () => {
      await page.getByTestId('booking-create-btn').click()
      await expect(page.getByTestId('booking-form-save-btn')).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 15000 })

    const form = dialog(page)
    const start = new Date(await form.locator('input[name="start"]').inputValue())
    const end = new Date(await form.locator('input[name="end"]').inputValue())
    expect(Math.round((end.getTime() - start.getTime()) / 60_000)).toBe(60)
    expect(Math.abs(Date.now() - end.getTime())).toBeLessThan(5 * 60_000)

    const saved = await saveForm(page, await pickFirstProject(page))
    created.push(saved)
    await expect(bookingRow(page, saved)).toBeVisible({ timeout: 10000 })
  })

  test('the edit form shows the booking and saves it unchanged', async ({ page }) => {
    await expect(async () => {
      await page.getByTestId('booking-create-btn').click()
      await expect(page.getByTestId('booking-form-save-btn')).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 15000 })
    const saved = await saveForm(page, await pickFirstProject(page))
    created.push(saved)

    await openRowMenu(page, bookingRow(page, saved), 'booking-ctx-edit-btn')
    const form = dialog(page)
    await expect(form.getByRole('combobox', { name: /proje/i })).toHaveValue(saved.project)
    expect(await timeOf(form.locator('input[name="start"]'))).toBe(saved.start)
    expect(await timeOf(form.locator('input[name="end"]'))).toBe(saved.end)

    const update = page.waitForRequest(
      (request) => request.method() !== 'GET' && request.url().includes('/api/proxy'),
    )
    await page.getByTestId('booking-form-save-btn').click()
    await update
    await expect(page.getByTestId('booking-form-save-btn')).toBeHidden({ timeout: 10000 })
    await expect(bookingRow(page, saved)).toBeVisible()
  })
})
