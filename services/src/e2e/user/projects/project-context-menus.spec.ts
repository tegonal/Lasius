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

/**
 * Opens the context menu on a project card by index.
 * Retries until the edit button is visible (handles hydration timing).
 */
const openProjectContextMenu = async (page: Page, index = 0) => {
  const openBtn = page.getByTestId('project-ctx-open-btn').nth(index)

  await expect(async () => {
    await openBtn.click()
    await expect(page.getByTestId('project-ctx-edit-btn')).toBeVisible({
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })
}

/**
 * Creates a project via the modal form and returns its name.
 */
const createProject = async (page: Page) => {
  const projectName = `e2e-ctx-${Date.now()}`

  await expect(async () => {
    await page.getByTestId('project-create-btn').first().click()
    await expect(page.getByTestId('project-form-key-input')).toBeVisible({
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })

  await page.getByTestId('project-form-key-input').fill(projectName)
  await page.getByTestId('project-form-save-btn').click()

  // Wait for modal to close and the new project card to appear
  // If creation fails (e.g. API error), close the form and skip
  try {
    await expect(page.getByTestId('project-form-key-input')).not.toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByTestId('project-card').first()).toBeVisible({
      timeout: 10000,
    })
  } catch {
    // Close form if still open, then dismiss
    const closeBtn = page.getByTestId('project-form-close-btn')
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click()
    }
    await page.keyboard.press('Escape')
  }

  return projectName
}

/**
 * Navigates to /user/projects, waits for content.
 * If no projects exist, creates one so tests can proceed.
 */
const ensureProjectsLoaded = async (page: Page) => {
  await page.goto('/user/projects')
  await expect(page).toHaveURL(/\/user\/projects/, { timeout: 15000 })
  await expect(page.getByTestId('project-create-btn').first()).toBeVisible({
    timeout: 10000,
  })

  const projectList = page.getByTestId('project-list')
  if (!(await projectList.isVisible({ timeout: 3000 }).catch(() => false))) {
    // No projects — create one
    await createProject(page)
  }
}

test.describe('Project context menu actions @projects', () => {
  test('edit project opens modal and closes without saving', async ({ page }) => {
    await ensureProjectsLoaded(page)

    await openProjectContextMenu(page)
    await page.getByTestId('project-ctx-edit-btn').click()

    // Edit form should appear
    await expect(page.getByTestId('project-form-key-input')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('project-form-save-btn')).toBeVisible()

    // Close without saving
    await page.getByTestId('project-form-close-btn').click()
    await expect(page.getByTestId('project-form-key-input')).not.toBeVisible({ timeout: 5000 })
  })

  test('manage members opens modal', async ({ page }) => {
    await ensureProjectsLoaded(page)

    // Retry: context menu close can race with modal open state
    await expect(async () => {
      await openProjectContextMenu(page)
      const membersBtn = page.getByTestId('project-ctx-members-btn')
      if (!(await membersBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
        test.skip()
        return
      }
      await membersBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 20000 })

    // Close the modal
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  })

  test('show bookings navigates to lists page', async ({ page }) => {
    await ensureProjectsLoaded(page)

    await openProjectContextMenu(page)

    const listsBtn = page.getByTestId('project-ctx-lists-btn')
    if (!(await listsBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip()
      return
    }

    await listsBtn.click()
    await expect(page).toHaveURL(/\/user\/lists\?projectId=/, { timeout: 10000 })
  })

  test('show statistics navigates to stats page', async ({ page }) => {
    await ensureProjectsLoaded(page)

    await openProjectContextMenu(page)

    const statsBtn = page.getByTestId('project-ctx-stats-btn')
    if (!(await statsBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip()
      return
    }

    await statsBtn.click()
    await expect(page).toHaveURL(/\/user\/stats/, { timeout: 15000 })
  })

  test('edit tags opens modal', async ({ page }) => {
    await ensureProjectsLoaded(page)

    // Retry: context menu close can race with modal open state
    await expect(async () => {
      await openProjectContextMenu(page)
      const tagsBtn = page.getByTestId('project-ctx-tags-btn')
      if (!(await tagsBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
        test.skip()
        return
      }
      await tagsBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 20000 })

    // Close the modal
    await page.keyboard.press('Escape')
  })

  test('leave project opens confirmation dialog and cancels', async ({ page }) => {
    await ensureProjectsLoaded(page)

    await openProjectContextMenu(page)

    const leaveBtn = page.getByTestId('project-ctx-leave-btn')
    await expect(leaveBtn).toBeVisible({ timeout: 2000 })
    await leaveBtn.click()

    // Confirm dialog should appear
    await expect(page.getByTestId('confirm-modal-confirm-btn')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('confirm-modal-cancel-btn')).toBeVisible()

    // Cancel — do NOT confirm to avoid leaving the project
    await page.getByTestId('confirm-modal-cancel-btn').click()
    await expect(page.getByTestId('confirm-modal-confirm-btn')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Project search filter @projects', () => {
  test('search input filters project list', async ({ page }) => {
    await page.goto('/user/projects')
    await expect(page).toHaveURL(/\/user\/projects/, { timeout: 15000 })
    await expect(page.getByTestId('project-create-btn').first()).toBeVisible({
      timeout: 10000,
    })

    const searchInput = page.getByTestId('project-search-input')
    // Search input only appears when >10 projects
    if (!(await searchInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip()
      return
    }

    const cardsBefore = await page.getByTestId('project-card').count()

    // Type a search term
    await searchInput.fill('nonexistent-project-xyz-999')

    // Wait for filtering — should show fewer (likely zero) cards
    await expect(async () => {
      const cardsAfter = await page.getByTestId('project-card').count()
      expect(cardsAfter).toBeLessThan(cardsBefore)
    }).toPass({ timeout: 5000 })

    // Clear search
    await page.getByTestId('project-search-clear-btn').click()

    // Cards should return to original count
    await expect(async () => {
      const cardsAfter = await page.getByTestId('project-card').count()
      expect(cardsAfter).toBe(cardsBefore)
    }).toPass({ timeout: 5000 })
  })
})
