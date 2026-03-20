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

import { expect, test as setup } from '@playwright/test'

const authFile = '.auth/user.json'

setup('authenticate via Internal Lasius Sign-in', async ({ page }) => {
  // Navigate to the app — it redirects to the login page
  await page.goto('/')
  await page.waitForURL(/.*\/login.*/)

  // Click the Internal Lasius Sign-in provider button
  await page.getByTestId('auth-provider-internal_lasius').click()
  await page.waitForURL(/.*\/internal_oauth\/login.*/)

  // Fill in the login form
  await page.getByTestId('auth-internal-email-input').fill('demo1@lasius.ch')
  await page.getByTestId('auth-internal-password-input').fill('demo')
  await page.getByTestId('auth-internal-submit-btn').click()

  // Wait for redirect back to the app after login
  await page.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

  // Accept Terms of Service if the modal appears
  const tosBtn = page.getByTestId('tos-accept-btn')
  if (await tosBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tosBtn.click()
    await tosBtn.waitFor({ state: 'hidden', timeout: 5000 })
  }

  // Verify we're logged in
  await expect(page.locator('body')).toBeVisible()

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
