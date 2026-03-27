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

test.describe('Registration flow @auth', () => {
  test('registration page renders all form fields', async ({ page }) => {
    await page.goto('/internal-oauth/register')

    await expect(page.getByTestId('auth-register-email-input')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('auth-register-firstname-input')).toBeVisible()
    await expect(page.getByTestId('auth-register-lastname-input')).toBeVisible()
    await expect(page.getByTestId('auth-register-password-input')).toBeVisible()
    await expect(page.getByTestId('auth-register-confirmpassword-input')).toBeVisible()
    await expect(page.getByTestId('auth-register-submit-btn')).toBeVisible()
  })

  test('navigate from login to register via signup button', async ({ page }) => {
    await page.goto('/internal-oauth/login', { waitUntil: 'domcontentloaded' })

    const signupBtn = page.getByTestId('auth-internal-signup-btn')
    if (!(await signupBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }
    // The signup button uses globalThis.location.href for navigation.
    // In Playwright headless, trigger the navigation and wait for it.
    await Promise.all([
      page.waitForURL(/.*\/internal-oauth\/register.*/, { timeout: 15000 }),
      signupBtn.click(),
    ])
    await expect(page.getByTestId('auth-register-email-input')).toBeVisible({ timeout: 15000 })
  })

  test('register with valid data redirects to login with success message', async ({ page }) => {
    await page.goto('/internal-oauth/register')

    const uniqueEmail = `e2e-test-${Date.now()}@lasius.ch`

    await page.getByTestId('auth-register-email-input').fill(uniqueEmail)
    await page.getByTestId('auth-register-firstname-input').fill('E2E')
    await page.getByTestId('auth-register-lastname-input').fill('TestUser')
    await page.getByTestId('auth-register-password-input').fill('SecurePass1')
    await page.getByTestId('auth-register-confirmpassword-input').fill('SecurePass1')
    await page.getByTestId('auth-register-submit-btn').click()

    await page.waitForURL(/.*\/internal-oauth\/login.*registered=true.*/, { timeout: 15000 })
    await expect(page.getByTestId('auth-internal-registered-success')).toBeVisible({
      timeout: 15000,
    })
  })

  test('register with duplicate email shows error', async ({ page }) => {
    await page.goto('/internal-oauth/register')

    await page.getByTestId('auth-register-email-input').fill('demo1@lasius.ch')
    await page.getByTestId('auth-register-firstname-input').fill('Demo')
    await page.getByTestId('auth-register-lastname-input').fill('User')
    await page.getByTestId('auth-register-password-input').fill('SecurePass1')
    await page.getByTestId('auth-register-confirmpassword-input').fill('SecurePass1')
    await page.getByTestId('auth-register-submit-btn').click()

    await expect(page.getByTestId('auth-register-error')).toBeVisible({ timeout: 15000 })
  })

  test('register with mismatched passwords shows validation error', async ({ page }) => {
    await page.goto('/internal-oauth/register')

    await page.getByTestId('auth-register-email-input').fill('mismatch@lasius.ch')
    await page.getByTestId('auth-register-firstname-input').fill('Test')
    await page.getByTestId('auth-register-lastname-input').fill('User')
    await page.getByTestId('auth-register-password-input').fill('SecurePass1')
    await page.getByTestId('auth-register-confirmpassword-input').fill('DifferentPass1')
    await page.getByTestId('auth-register-submit-btn').click()

    // Confirm password field should be marked invalid by Conform
    await expect(page.getByTestId('auth-register-confirmpassword-input')).toHaveAttribute(
      'aria-invalid',
      'true',
      { timeout: 5000 },
    )
  })

  test('register with weak password shows validation error', async ({ page }) => {
    await page.goto('/internal-oauth/register')

    await page.getByTestId('auth-register-email-input').fill('weak@lasius.ch')
    await page.getByTestId('auth-register-firstname-input').fill('Test')
    await page.getByTestId('auth-register-lastname-input').fill('User')
    // Password too short and missing uppercase/number
    await page.getByTestId('auth-register-password-input').fill('short')
    await page.getByTestId('auth-register-confirmpassword-input').fill('short')
    await page.getByTestId('auth-register-submit-btn').click()

    // Password field should be marked invalid by Conform
    await expect(page.getByTestId('auth-register-password-input')).toHaveAttribute(
      'aria-invalid',
      'true',
      { timeout: 5000 },
    )
  })
})
