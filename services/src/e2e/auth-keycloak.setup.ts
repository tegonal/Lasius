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

const authFile = '.auth/keycloak-user.json'

setup('authenticate via Keycloak', async ({ page }) => {
  // Navigate to the app — it redirects to the login page
  await page.goto('/')
  await page.waitForURL(/.*\/login.*/)

  // Click the Keycloak provider button
  await page.getByTestId('auth-provider-custom_keycloak').click()

  // Wait for redirect to Keycloak login form
  await page.waitForURL(/.*localhost:8080.*/, { timeout: 15000 })

  // Wait for the Keycloak login form to render
  await page.getByLabel('Email').waitFor({ state: 'visible', timeout: 15000 })

  // Fill in Keycloak login form
  await page.getByLabel('Email').fill('e2e@lasius.ch')
  await page.locator('input#password').fill('e2e-test')
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for redirect back to the app after login (OAuth callback + SSR can be slow on cold start)
  await page.waitForURL(/.*localhost:3000\/user\/.*/, { timeout: 30000 })

  // Verify we're logged in
  await expect(page.locator('body')).toBeVisible()

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
