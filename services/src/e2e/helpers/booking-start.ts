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

import { expect, type Page } from '@playwright/test'

/**
 * Clicks the start button of the quick start form after a project pick. The pick moves the focus
 * to the tags input, and its open list covers the start button until the input loses the focus.
 */
export async function clickStartAfterProjectPick(page: Page) {
  const tagsInput = page.getByRole('combobox', { name: /tags/i })
  await expect(tagsInput).toBeFocused({ timeout: 5000 })
  await tagsInput.blur()
  await expect(tagsInput).not.toBeFocused()
  await page.getByTestId('booking-start-submit-btn').click()
}
