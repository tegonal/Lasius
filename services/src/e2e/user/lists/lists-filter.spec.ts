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

const openFilter = async (page: Page) => {
  await page.goto('/user/lists')
  const filter = page.getByTestId('lists-filter')
  await expect(filter).toBeVisible({ timeout: 15000 })
  // The hook writes from and to into the URL after hydration.
  await expect(page).toHaveURL(/from=.*to=/, { timeout: 15000 })
  return filter
}

/** Picks the first project option, or returns false when the user has no project. */
const pickFirstProject = async (page: Page) => {
  const filter = page.getByTestId('lists-filter')
  const projectInput = filter.getByRole('combobox', { name: /proje/i })
  const chevron = projectInput
    .locator('xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]')
    .last()
  await expect(async () => {
    if ((await projectInput.getAttribute('aria-expanded')) !== 'true') await chevron.click()
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 15000 })
  const options = page.locator('[role="option"]')
  if ((await options.count()) === 0) return false
  await options.first().click()
  return true
}

test.describe('Booking history filter', () => {
  test('a project choice goes into the URL, survives a reload, and Reset removes it', async ({
    page,
  }) => {
    const filter = await openFilter(page)
    const projectValue = filter.locator('input[name="projectId"]')

    if (!(await pickFirstProject(page))) {
      test.skip()
      return
    }

    await expect(page).toHaveURL(/projectId=[\w-]+/)
    const projectId = await projectValue.inputValue()
    expect(projectId).not.toBe('')

    await page.reload()
    await expect(filter.locator('input[name="projectId"]')).toHaveValue(projectId, {
      timeout: 15000,
    })

    const reset = filter.getByTestId('lists-filter-reset-btn')
    await expect(async () => {
      await reset.click()
      await expect(page).not.toHaveURL(/projectId=/, { timeout: 2000 })
    }).toPass({ timeout: 15000 })
    await expect(filter.locator('input[name="projectId"]')).toHaveValue('')
    // A native form submit would add every field name to the URL.
    await expect(page).not.toHaveURL(/dateRange=/)
  })

  test('a shared link with only a projectId selects the project and adds the range', async ({
    page,
  }) => {
    const filter = await openFilter(page)
    if (!(await pickFirstProject(page))) {
      test.skip()
      return
    }
    const projectId = await filter.locator('input[name="projectId"]').inputValue()

    await page.goto(`/user/lists?projectId=${projectId}`)
    await expect(filter.locator('input[name="projectId"]')).toHaveValue(projectId, {
      timeout: 15000,
    })
    await expect(page).toHaveURL(new RegExp(`projectId=${projectId}`))
    await expect(page).toHaveURL(/from=.*to=/)
    await expect(filter.getByTestId('lists-filter-reset-btn')).toBeVisible()
  })
})
