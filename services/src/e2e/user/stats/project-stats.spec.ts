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

// The demo seed makes demo1 ProjectAdministrator of Lasius and ProjectMember of Marketing.
const ADMINISTERED_PROJECT = 'Lasius'
const MEMBER_PROJECT = 'Marketing'

// The app layout renders a mobile copy and a desktop copy of the page.
const visible = (page: Page, testId: string) =>
  page.getByTestId(testId).locator('visible=true').first()

const projectRow = (page: Page, name: string) =>
  page.getByTestId('project-card').locator('visible=true').filter({ hasText: name }).first()

// Another spec can switch demo1 to another organisation, so a missing row skips the test.
const findRowOrSkip = async (page: Page, path: string, name: string) => {
  await page.goto(path)
  const row = projectRow(page, name)
  const hasRow = await row
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  test.skip(!hasRow, `demo1 has no ${name} row in the selected organisation`)
  return row
}

// The open button toggles the menu, so the retry clicks only while the menu is closed.
const openMenu = async (page: Page, row: Locator, openBtnId: string, entryId: string) => {
  const openBtn = row.getByTestId(openBtnId)
  await expect(async () => {
    if ((await openBtn.getAttribute('aria-expanded')) !== 'true') await openBtn.click()
    await expect(visible(page, entryId)).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
}

const expectProjectStatsPage = async (page: Page, scope: 'organisation' | 'user') => {
  await expect(page).toHaveURL(new RegExp(`/${scope}/stats/project/[0-9a-f-]+`), {
    timeout: 15000,
  })
  await expect(visible(page, 'project-stats-page')).toBeVisible({ timeout: 15000 })
  await expect(visible(page, 'stats-filter-project')).toHaveText(ADMINISTERED_PROJECT)
  await expect(visible(page, 'stats-tab-tags')).toHaveAttribute('aria-current', 'page')

  await visible(page, 'stats-tab-users').click()
  await expect(page).toHaveURL(/view=users/, { timeout: 10000 })
  await expect(visible(page, 'stats-tab-users')).toHaveAttribute('aria-current', 'page')
}

test.describe('Project statistics @stats', () => {
  test('opens the project statistics from my projects and goes back', async ({ page }) => {
    const row = await findRowOrSkip(page, '/user/projects', ADMINISTERED_PROJECT)
    await openMenu(page, row, 'project-ctx-open-btn', 'project-ctx-stats-btn')
    await visible(page, 'project-ctx-stats-btn').click()

    await expectProjectStatsPage(page, 'user')

    await expect(async () => {
      await visible(page, 'stats-filter-back').click()
      await expect(page).toHaveURL(/\/user\/projects/, { timeout: 2000 })
    }).toPass({ timeout: 15000 })
  })

  test('opens the project statistics from the organisation projects', async ({ page }) => {
    const row = await findRowOrSkip(page, '/organisation/projects', ADMINISTERED_PROJECT)
    await openMenu(page, row, 'org-project-ctx-open-btn', 'org-project-ctx-stats-btn')
    await visible(page, 'org-project-ctx-stats-btn').click()

    await expectProjectStatsPage(page, 'organisation')
  })

  test('hides and refuses the statistics of a project without the admin role', async ({ page }) => {
    const row = await findRowOrSkip(page, '/organisation/projects', MEMBER_PROJECT)
    // The lists entry is always present, so it proves that the menu opened.
    await openMenu(page, row, 'org-project-ctx-open-btn', 'org-project-ctx-lists-btn')
    await expect(page.getByTestId('org-project-ctx-stats-btn').locator('visible=true')).toHaveCount(
      0,
    )

    await visible(page, 'org-project-ctx-lists-btn').click()
    await expect(page).toHaveURL(/projectId=/, { timeout: 10000 })
    const projectId = new URL(page.url()).searchParams.get('projectId')

    await page.goto(`/organisation/stats/project/${projectId}`)
    await expect(page).toHaveURL(/\/organisation\/projects/, { timeout: 15000 })
    await page.goto(`/user/stats/project/${projectId}`)
    await expect(page).toHaveURL(/\/user\/projects/, { timeout: 15000 })
  })
})
