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

const timestamp = Date.now()
const orgName = `E2E Org ${timestamp}`
const newUserEmail = `e2e-newuser-${timestamp}@lasius.ch`
const newUserPassword = 'E2eTest1!pass'

/** Dismiss the Terms of Service modal if it appears. */
async function acceptTosIfVisible(page: Page, timeout = 5000) {
  try {
    const tosBtn = page.getByTestId('tos-accept-btn')
    await tosBtn.waitFor({ state: 'visible', timeout })
    await tosBtn.click()
    await tosBtn.waitFor({ state: 'hidden', timeout: 5000 })
  } catch {
    // ToS not shown — continue
  }
}

/**
 * Log in via Internal Lasius provider from the login page.
 * Assumes the page is on /login (provider selection page).
 */
async function loginAsInternalUser(page: Page, email: string, password: string) {
  // Navigate directly to the internal login page (avoids clicking
  // the provider link which has a nested button that swallows clicks)
  if (!page.url().includes('/internal-oauth/login')) {
    await page.goto('/internal-oauth/login')
    await page.waitForURL(/.*\/internal-oauth\/login.*/, { timeout: 10000 })
  }

  // Fill login form
  await page.getByTestId('auth-internal-email-input').fill(email)
  await page.getByTestId('auth-internal-password-input').fill(password)
  await page.getByTestId('auth-internal-submit-btn').click()
}

test.describe.serial('Organisation + Invitation lifecycle @org', () => {
  let page: Page
  let existingUserInviteLink: string | null = null
  let newUserInviteLink: string | null = null

  test.beforeAll(async ({ browser }) => {
    // Shared page with auth state — persists org selection across tests
    const context = await browser.newContext({ storageState: '.auth/user.json' })
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await page?.context().close()
  })

  test('create organisation', async () => {
    await page.goto('/organisation/current')
    await page.waitForURL(/.*\/organisation\/current.*/, { timeout: 15000 })
    await acceptTosIfVisible(page)

    // DaisyUI dropdown: click may not register on first try due to focus/blur timing
    await expect(async () => {
      await page.getByTestId('org-actions-dropdown').first().click()
      await page.getByTestId('org-actions-create-btn').first().click()
      await expect(page.getByTestId('org-form-name-input')).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    // Fill org name and submit
    await page.getByTestId('org-form-name-input').fill(orgName)
    await page.getByTestId('org-form-submit-btn').click()

    // Verify the org name appears on the page (dynamic test data, not a translation)
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })
  })

  test('invite existing user to organisation', async () => {
    // Shared page still shows the newly created org from previous test
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })

    // DaisyUI dropdown: retry pattern for click timing
    await expect(async () => {
      await page.getByTestId('org-actions-dropdown').first().click()
      await page.getByTestId('org-actions-invite-btn').first().click()
      await expect(page.getByTestId('org-invite-email-input')).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    // Fill email and submit
    await page.getByTestId('org-invite-email-input').fill('demo2@lasius.ch')
    await page.getByTestId('org-invite-submit-btn').click()

    // Two outcomes: invitation link generated OR user assigned directly
    const inviteLinkLocator = page.getByTestId('org-invite-link')
    const assignedCloseLocator = page.getByTestId('org-invite-assigned-close-btn')

    // Wait for either result modal to appear
    const result = await Promise.race([
      inviteLinkLocator.waitFor({ timeout: 10000 }).then(() => 'link' as const),
      assignedCloseLocator.waitFor({ timeout: 10000 }).then(() => 'assigned' as const),
    ])

    if (result === 'link') {
      const linkText = await inviteLinkLocator.textContent()
      existingUserInviteLink = linkText?.trim() || null
      await page.getByTestId('org-invite-close-btn').click()
    } else {
      // User was assigned directly — no invitation link
      existingUserInviteLink = null
      await assignedCloseLocator.click()
    }
  })

  test('wrong account sees other-session message', async () => {
    test.skip(!existingUserInviteLink, 'No invitation link — user was assigned directly')

    // Use the shared page (logged in as demo1) to visit demo2's invite link
    await page.goto(existingUserInviteLink!)
    await page.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

    // demo1 email does not match the invite's target (demo2) → InvitationOtherSession
    await expect(page.getByTestId('invite-other-session')).toBeVisible({ timeout: 15000 })

    // Navigate back to the org page for subsequent tests
    await page.goto('/organisation/current')
    await page.waitForURL(/.*\/organisation\/current.*/, { timeout: 15000 })
  })

  test('existing user accepts organisation invitation', async ({ browser }) => {
    test.setTimeout(120000)
    test.skip(!existingUserInviteLink, 'No invitation link — user was assigned directly')

    // Login as demo2 in a clean (unauthenticated) context
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const freshPage = await context.newPage()

    try {
      await freshPage.goto('/login')
      await loginAsInternalUser(freshPage, 'demo2@lasius.ch', 'demo')
      await freshPage.waitForURL(/.*\/user\/.*/, { timeout: 30000 })
      await acceptTosIfVisible(freshPage, 15000)

      // Phase 2: Visit the invite link in the same session
      await freshPage.goto(existingUserInviteLink!)
      await freshPage.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

      // Authenticated on the join page — see InvitationUserConfirm
      await expect(freshPage.getByTestId('invite-accept-btn')).toBeVisible({ timeout: 15000 })

      // Accept the invitation — click and wait for navigation away from /join/
      // The handler calls navigate('/') which may not fire immediately
      await expect(async () => {
        await freshPage.getByTestId('invite-accept-btn').click()
        await freshPage.waitForURL((url) => !url.pathname.startsWith('/join/'), { timeout: 5000 })
      }).toPass({ timeout: 30000 })
    } finally {
      await context.close()
    }
  })

  test('invite new user to organisation', async () => {
    // Shared page still shows the newly created org
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })

    // DaisyUI dropdown: retry pattern for click timing
    await expect(async () => {
      await page.getByTestId('org-actions-dropdown').first().click()
      await page.getByTestId('org-actions-invite-btn').first().click()
      await expect(page.getByTestId('org-invite-email-input')).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    // Fill email and submit
    await page.getByTestId('org-invite-email-input').fill(newUserEmail)
    await page.getByTestId('org-invite-submit-btn').click()

    // Capture the invitation link
    const inviteLinkLocator = page.getByTestId('org-invite-link')
    await expect(inviteLinkLocator).toBeVisible({ timeout: 10000 })
    const linkText = await inviteLinkLocator.textContent()
    newUserInviteLink = linkText?.trim() || null

    await page.getByTestId('org-invite-close-btn').click()
  })

  test('new user registers and accepts invitation', async ({ browser }) => {
    test.setTimeout(120000)
    test.skip(!newUserInviteLink, 'No invitation link from previous test')

    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const freshPage = await context.newPage()

    try {
      // Register the new user — navigate directly (provider link has nested button)
      await freshPage.goto('/internal-oauth/login')
      await freshPage.waitForURL(/.*\/internal-oauth\/login.*/, { timeout: 10000 })

      await freshPage.getByTestId('auth-internal-signup-btn').click()
      await freshPage.waitForURL(/.*\/internal-oauth\/register.*/, { timeout: 20000 })

      await freshPage.getByTestId('auth-register-email-input').fill(newUserEmail)
      await freshPage.getByTestId('auth-register-firstname-input').fill('E2E')
      await freshPage.getByTestId('auth-register-lastname-input').fill('User')
      await freshPage.getByTestId('auth-register-password-input').fill(newUserPassword)
      await freshPage.getByTestId('auth-register-confirmpassword-input').fill(newUserPassword)

      // Submit registration — redirects to login page
      await freshPage.getByTestId('auth-register-submit-btn').click()
      await freshPage.waitForURL(/.*\/login.*/, { timeout: 15000 })

      // Log in with new credentials in the same context
      await loginAsInternalUser(freshPage, newUserEmail, newUserPassword)
      await freshPage.waitForURL(/.*\/user\/.*/, { timeout: 30000 })
      await acceptTosIfVisible(freshPage)

      // Visit the invite link
      await freshPage.goto(newUserInviteLink!)
      await freshPage.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

      // Authenticated on the join page — see InvitationUserConfirm
      await expect(freshPage.getByTestId('invite-accept-btn')).toBeVisible({ timeout: 10000 })

      // Accept the invitation — retry since navigate('/') may not fire immediately
      await expect(async () => {
        await freshPage.getByTestId('invite-accept-btn').click()
        await freshPage.waitForURL((url) => !url.pathname.startsWith('/join/'), { timeout: 5000 })
      }).toPass({ timeout: 30000 })
    } finally {
      await context.close()
    }
  })

  test('invalid invitation shows error', async ({ browser }) => {
    const context = await browser.newContext()
    const freshPage = await context.newPage()

    try {
      await freshPage.goto('/join/00000000-0000-0000-0000-000000000000')
      await freshPage.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

      // Invalid invitation ID → InvitationInvalid
      await expect(freshPage.getByTestId('invite-invalid')).toBeVisible({ timeout: 15000 })
    } finally {
      await context.close()
    }
  })
})
