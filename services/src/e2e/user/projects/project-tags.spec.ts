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

/** Creates a project that only this test uses, so a tag change touches no shared data. */
const createOwnProject = async (page: Page) => {
  const projectName = `e2e-tags-${Date.now()}`
  await page.goto('/user/projects')
  await expect(async () => {
    await page.getByTestId('project-create-btn').first().click()
    await expect(page.getByTestId('project-form-key-input')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
  await page.getByTestId('project-form-key-input').fill(projectName)
  await page.getByTestId('project-form-save-btn').click()
  await expect(page.getByTestId('project-form-key-input')).toBeHidden({ timeout: 10000 })
  return projectName
}

const openTagManager = async (page: Page, projectName: string) => {
  const card = page.getByTestId('project-card').filter({ hasText: projectName })
  await expect(async () => {
    await card.getByTestId('project-ctx-open-btn').locator('visible=true').first().click()
    await expect(page.getByTestId('project-ctx-tags-btn')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
  await page.getByTestId('project-ctx-tags-btn').click()
  await expect(page.getByTestId('tag-manager-save-btn')).toBeVisible({ timeout: 10000 })
}

const fillInputModal = async (page: Page, value: string) => {
  await page.getByTestId('input-modal-input').fill(value)
  await page.getByTestId('input-modal-confirm-btn').click()
  await expect(page.getByTestId('input-modal-input')).toBeHidden()
}

const saveTags = async (page: Page) => {
  await page.getByTestId('tag-manager-save-btn').click()
  await expect(page.getByTestId('tag-manager-save-btn')).toBeHidden({ timeout: 10000 })
}

test.describe('Project tag manager', () => {
  test('a tag group with a tag survives a save, and a deletion survives a save', async ({
    page,
  }) => {
    const projectName = await createOwnProject(page)
    const groupName = `group-${Date.now()}`
    const group = page.getByTestId(`tag-group-${groupName}`)
    // The form shows no group until the tags load, so a kept group proves the load finished.
    const keptGroupName = `kept-${Date.now()}`
    const keptGroup = page.getByTestId(`tag-group-${keptGroupName}`)

    await openTagManager(page, projectName)
    await page.getByTestId('tag-manager-add-group-btn').click()
    await fillInputModal(page, keptGroupName)
    await page.getByTestId('tag-manager-add-group-btn').click()
    await fillInputModal(page, groupName)
    await expect(group).toBeVisible()

    await group.getByTestId('tag-group-add-tag-btn').click()
    await fillInputModal(page, 'e2e-tag')
    await expect(group).toContainText('e2e-tag')
    await saveTags(page)

    await openTagManager(page, projectName)
    await expect(group).toBeVisible({ timeout: 10000 })
    await expect(group).toContainText('e2e-tag')

    await group.hover()
    await group.getByTestId('tag-group-delete-btn').click()
    await page.getByTestId('confirm-modal-confirm-btn').click()
    await expect(group).toBeHidden()
    await saveTags(page)

    await openTagManager(page, projectName)
    await expect(keptGroup).toBeVisible({ timeout: 10000 })
    await expect(group).toBeHidden()
  })

  test('Cancel after a change asks before it discards', async ({ page }) => {
    const projectName = await createOwnProject(page)
    await openTagManager(page, projectName)

    await page.getByTestId('tag-manager-add-group-btn').click()
    await fillInputModal(page, `group-${Date.now()}`)

    await page.getByTestId('tag-manager-cancel-btn').click()
    await expect(page.getByTestId('confirm-modal-confirm-btn')).toBeVisible()
    await page.getByTestId('confirm-modal-confirm-btn').click()
    await expect(page.getByTestId('tag-manager-save-btn')).toBeHidden()
  })

  test('Cancel without a change closes at once', async ({ page }) => {
    const projectName = await createOwnProject(page)
    await openTagManager(page, projectName)

    await page.getByTestId('tag-manager-cancel-btn').click()
    await expect(page.getByTestId('tag-manager-save-btn')).toBeHidden()
    await expect(page.getByTestId('confirm-modal-confirm-btn')).toBeHidden()
  })
})
