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

test('login page shows provider buttons @auth', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByTestId('auth-provider-internal_lasius')).toBeVisible()
  await expect(page.getByTestId('auth-provider-custom_keycloak')).toBeVisible()
})

test('login page shows error from query param @auth', async ({ page }) => {
  await page.goto('/login?error=OAuthSignin')

  await expect(page.getByTestId('auth-login-error')).toBeVisible()
})

test('invalid credentials show error @auth', async ({ page }) => {
  await page.goto('/login')

  // Click internal provider
  await page.getByTestId('auth-provider-internal_lasius').click()
  await page.waitForURL(/.*\/internal_oauth\/login.*/)

  // Fill wrong credentials
  await page.getByTestId('auth-internal-email-input').fill('demo1@lasius.ch')
  await page.getByTestId('auth-internal-password-input').fill('wrong-password')
  await page.getByTestId('auth-internal-submit-btn').click()

  // Verify error is shown
  await expect(page.getByTestId('auth-internal-login-error')).toBeVisible()
})
