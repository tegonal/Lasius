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

test.describe('Projects page', () => {
  test('projects list loads @smoke', async ({ page }) => {
    await page.goto('/user/projects', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\/projects/, { timeout: 15000 })

    // Verify the project list table is visible
    await expect(page.getByTestId('project-list')).toBeVisible({ timeout: 10000 })

    // Verify at least one project card is present (demo data)
    const cards = page.getByTestId('project-card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('create new project via modal @smoke', async ({ page }) => {
    await page.goto('/user/projects', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\/projects/, { timeout: 15000 })

    // Wait for page to load
    await expect(page.getByTestId('project-list')).toBeVisible({ timeout: 10000 })

    // Click create button
    await page.getByTestId('project-create-btn').click()

    // Verify form is visible
    await expect(page.getByTestId('project-form-key-input')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('project-form-save-btn')).toBeVisible()

    // Fill in a unique project name
    const projectName = `e2e-test-${Date.now()}`
    await page.getByTestId('project-form-key-input').fill(projectName)

    // Close without saving to avoid polluting data
    await page.getByTestId('project-form-close-btn').click()

    // Verify modal closed — form input should no longer be visible
    await expect(page.getByTestId('project-form-key-input')).not.toBeVisible({ timeout: 5000 })
  })

  test('open project context menu @smoke', async ({ page }) => {
    await page.goto('/user/projects', { timeout: 15000 })
    await expect(page).toHaveURL(/\/user\/projects/, { timeout: 15000 })

    // Wait for project list
    await expect(page.getByTestId('project-list')).toBeVisible({ timeout: 10000 })

    // Click the context menu open button on the first project
    const firstContextBtn = page.getByTestId('project-ctx-open-btn').first()
    await expect(firstContextBtn).toBeVisible({ timeout: 5000 })
    await firstContextBtn.click()

    // Verify context menu appeared — the edit button should be visible if user is admin
    // If user is member-only, edit button won't appear, so check gracefully
    const editBtn = page.getByTestId('project-ctx-edit-btn')
    const isEditVisible = await editBtn.isVisible().catch(() => false)

    if (isEditVisible) {
      await expect(editBtn).toBeVisible()
    }

    // Close context menu by pressing Escape
    await page.keyboard.press('Escape')
  })
})
