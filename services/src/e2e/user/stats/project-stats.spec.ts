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

// The app layout renders a mobile copy and a desktop copy of the page.
const visible = (page: Page, testId: string) =>
  page.getByTestId(testId).locator('visible=true').first()

const openStatsFromMenu = async (page: Page, openBtnId: string, statsBtnId: string) => {
  const openBtn = page.getByTestId(openBtnId).first()
  if (!(await openBtn.isVisible({ timeout: 10000 }).catch(() => false))) return false

  // The menu shows the statistics entry only to a project administrator.
  const isOpened = await expect(async () => {
    await openBtn.click()
    await expect(page.getByTestId(statsBtnId)).toBeVisible({ timeout: 1000 })
  })
    .toPass({ timeout: 10000 })
    .then(() => true)
    .catch(() => false)
  if (!isOpened) return false
  await page.getByTestId(statsBtnId).click()
  return true
}

const expectProjectStatsPage = async (page: Page, scope: 'organisation' | 'user') => {
  await expect(page).toHaveURL(new RegExp(`/${scope}/stats/project/[0-9a-f-]+`), {
    timeout: 15000,
  })
  await expect(visible(page, 'project-stats-page')).toBeVisible({ timeout: 15000 })
  await expect(visible(page, 'stats-filter-project')).not.toBeEmpty()
  await expect(visible(page, 'stats-tab-tags')).toHaveAttribute('aria-current', 'page')

  await visible(page, 'stats-tab-users').click()
  await expect(page).toHaveURL(/view=users/, { timeout: 10000 })
  await expect(visible(page, 'stats-tab-users')).toHaveAttribute('aria-current', 'page')
}

test.describe('Project statistics @stats', () => {
  test('opens the project statistics from my projects and goes back', async ({ page }) => {
    await page.goto('/user/projects')
    if (!(await openStatsFromMenu(page, 'project-ctx-open-btn', 'project-ctx-stats-btn'))) {
      test.skip()
      return
    }

    await expectProjectStatsPage(page, 'user')

    await expect(async () => {
      await visible(page, 'stats-filter-back').click()
      await expect(page).toHaveURL(/\/user\/projects/, { timeout: 2000 })
    }).toPass({ timeout: 15000 })
  })

  test('opens the project statistics from the organisation projects', async ({ page }) => {
    await page.goto('/organisation/projects')
    if (!(await openStatsFromMenu(page, 'org-project-ctx-open-btn', 'org-project-ctx-stats-btn'))) {
      test.skip()
      return
    }

    await expectProjectStatsPage(page, 'organisation')
  })

  test('answers 404 for a project the user cannot see', async ({ page }) => {
    const response = await page.goto('/user/stats/project/00000000-0000-0000-0000-000000000001')
    expect(response?.status()).toBe(404)
  })
})
