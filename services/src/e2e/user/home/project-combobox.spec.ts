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

type Combobox = { chevron: Locator; hidden: Locator; input: Locator }

const findCombobox = (page: Page): Combobox => {
  const input = page.getByRole('combobox', { name: /proje/i }).first()
  return {
    chevron: input
      .locator('xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]')
      .last(),
    hidden: input.locator('xpath=ancestor::form//input[@name="projectId"]'),
    input,
  }
}

const openList = async (page: Page, combobox: Combobox) => {
  await expect(async () => {
    if ((await combobox.input.getAttribute('aria-expanded')) !== 'true')
      await combobox.chevron.click()
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15000 })
}

/** Opens the list and returns the option labels, or skips when the organisation has no project. */
const optionLabels = async (page: Page, combobox: Combobox) => {
  await openList(page, combobox)
  const labels = await page.locator('[role="option"]').allInnerTexts()
  if (labels.length === 0) test.skip(true, 'The selected organisation has no project.')
  return labels.map((label) => label.trim())
}

const pickFirst = async (page: Page, combobox: Combobox) => {
  const [first] = await optionLabels(page, combobox)
  await page.locator('[role="option"]').first().click()
  await expect(combobox.input).toHaveValue(first ?? '')
  await expect(combobox.hidden).not.toHaveValue('')
  return first ?? ''
}

test.describe('Project combobox in the quick-start form', () => {
  let combobox: Combobox

  test.beforeEach(async ({ page }) => {
    await page.goto('/user/home')
    combobox = findCombobox(page)
    await expect(combobox.input).toBeVisible({ timeout: 15000 })
  })

  test('typing filters the options', async ({ page }) => {
    const labels = await optionLabels(page, combobox)
    const query = (labels[0] ?? '').slice(0, 3)
    await page.keyboard.press('Escape')

    await combobox.input.fill(query)
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    const filtered = await page.locator('[role="option"]').allInnerTexts()
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.length).toBeLessThanOrEqual(labels.length)
    for (const label of filtered) {
      expect(label.toLowerCase()).toContain(query.toLowerCase())
    }
  })

  test('a pick fills the input, and the X button clears it and focuses the input', async ({
    page,
  }) => {
    await pickFirst(page, combobox)

    const reset = combobox.input
      .locator('xpath=ancestor::div[contains(@class,"join")]//button[contains(@class,"join-item")]')
      .first()
    await reset.click()
    await expect(combobox.input).toHaveValue('')
    await expect(combobox.hidden).toHaveValue('')
    await expect(combobox.input).toBeFocused()
  })

  test('Escape on a closed list keeps the selection', async ({ page }) => {
    const picked = await pickFirst(page, combobox)
    await combobox.input.focus()
    await expect(combobox.input).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('Escape')
    await expect(combobox.input).toHaveValue(picked)
    await expect(combobox.hidden).not.toHaveValue('')
  })

  test('Enter on an open list without a highlight does not submit the form', async ({ page }) => {
    const labels = await optionLabels(page, combobox)
    let submitted = false
    page.on('request', (request) => {
      if (request.method() === 'POST') submitted = true
    })

    await combobox.input.fill((labels[0] ?? '').slice(0, 2))
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page.keyboard.press('Enter')

    await expect(combobox.hidden).toHaveValue('')
    await page.waitForLoadState('networkidle')
    expect(submitted).toBe(false)
  })
})
