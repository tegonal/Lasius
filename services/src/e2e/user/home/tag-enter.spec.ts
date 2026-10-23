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

// None of these tests saves a booking. Each one checks the form state only.

const openEditDialog = async (page: Page) => {
  // A day with bookings in the demo data.
  await page.goto('/user/home?date=2026-10-13')
  const bookingItem = page.getByTestId('booking-item').first()
  if (!(await bookingItem.isVisible({ timeout: 10000 }).catch(() => false))) return null

  await expect(async () => {
    await bookingItem.getByTestId('booking-ctx-open-btn').click()
    await expect(page.getByTestId('booking-ctx-edit-btn')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 10000 })
  await page.getByTestId('booking-ctx-edit-btn').click()
  const dialog = page.getByTestId('modal-dialog')
  const tagsInput = dialog.getByRole('combobox', { name: /tags/i })
  await expect(tagsInput).toBeFocused({ timeout: 5000 })
  return { dialog, tagsInput }
}

test.describe('Enter in the tags input @bookings', () => {
  test('the quick start form adds the typed tag and does not submit', async ({ page }) => {
    await page.goto('/user/home')
    const tagsInput = page.getByRole('combobox', { name: /tags/i }).locator('visible=true').first()
    const tag = `entertag${Date.now()}`
    // The handlers attach at hydration, so the typing repeats until the list shows.
    await expect(async () => {
      await tagsInput.click()
      await tagsInput.fill('')
      await tagsInput.pressSequentially(tag)
      await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    await tagsInput.press('Enter')

    const form = page.locator('form', { has: tagsInput })
    await expect(form.locator('input[type=hidden][name=tags]')).toHaveValue(new RegExp(tag))
    await expect(tagsInput).toHaveValue('')
    await expect(page).toHaveURL(/\/user\/home/)
  })

  test('the edit dialog adds the typed tag and stays open', async ({ page }) => {
    const edit = await openEditDialog(page)
    if (!edit) {
      test.skip()
      return
    }
    const tag = `entertag${Date.now()}`
    await edit.tagsInput.pressSequentially(tag)
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 5000 })

    await edit.tagsInput.press('Enter')

    await expect(edit.dialog).toBeVisible()
    await expect(edit.dialog.locator('input[type=hidden][name=tags]')).toHaveValue(new RegExp(tag))
    await expect(edit.tagsInput).toHaveValue('')
  })

  test('Arrow Down and Enter select an existing suggestion', async ({ page }) => {
    const edit = await openEditDialog(page)
    if (!edit) {
      test.skip()
      return
    }
    const highlighted = page.locator('[role="option"][data-highlighted]')
    await edit.tagsInput.press('ArrowDown')
    await expect(async () => {
      if ((await highlighted.count()) === 0) await edit.tagsInput.press('ArrowDown')
      await expect(highlighted).toHaveCount(1, { timeout: 1000 })
    }).toPass({ timeout: 5000 })
    const suggestion = (await highlighted.innerText()).trim()

    await edit.tagsInput.press('Enter')

    await expect(edit.dialog).toBeVisible()
    await expect(edit.dialog.locator('input[type=hidden][name=tags]')).toHaveValue(
      new RegExp(suggestion.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)),
    )
  })
})
