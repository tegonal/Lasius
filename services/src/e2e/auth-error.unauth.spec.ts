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

test('auth error page shows error details @auth', async ({ page }) => {
  await page.goto('/auth/error?error=AccessDenied')

  await expect(page.getByTestId('auth-error-title')).toBeVisible()
  await expect(page.getByTestId('auth-error-message')).toBeVisible()
  await expect(page.getByTestId('auth-error-code')).toBeVisible()
})

test('back to login button navigates to login @auth', async ({ page }) => {
  await page.goto('/auth/error?error=AccessDenied')

  // Wait for the back button to render before clicking
  await page.getByTestId('auth-error-back-btn').waitFor({ state: 'visible', timeout: 15000 })
  await page.getByTestId('auth-error-back-btn').click()

  await page.waitForURL(/.*\/login.*/, { timeout: 15000 })
})
