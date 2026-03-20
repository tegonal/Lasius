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
  // If on the login provider page, click internal provider
  try {
    const providerBtn = page.getByTestId('auth-provider-internal_lasius')
    await providerBtn.waitFor({ state: 'visible', timeout: 10000 })
    await providerBtn.click()
    await page.waitForURL(/.*\/internal_oauth\/login.*/, { timeout: 10000 })
  } catch {
    // Already on the internal login page — continue
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

    // LayoutResponsive renders children twice (desktop + mobile); use .first() for desktop
    await page.getByTestId('org-actions-dropdown').first().click()
    await page.getByTestId('org-actions-create-btn').first().click()

    // Fill org name and submit
    await page.getByTestId('org-form-name-input').fill(orgName)
    await page.getByTestId('org-form-submit-btn').click()

    // Verify the org name appears on the page (dynamic test data, not a translation)
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })
  })

  test('invite existing user to organisation', async () => {
    // Shared page still shows the newly created org from previous test
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })

    // LayoutResponsive renders children twice (desktop + mobile); use .first() for desktop
    await page.getByTestId('org-actions-dropdown').first().click()
    await page.getByTestId('org-actions-invite-btn').first().click()

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

    // Phase 1: Login as demo2 and save session state
    const loginContext = await browser.newContext()
    const loginPage = await loginContext.newPage()

    try {
      await loginPage.goto('/login')
      await loginAsInternalUser(loginPage, 'demo2@lasius.ch', 'demo')
      await loginPage.waitForURL(/.*\/user\/.*/, { timeout: 30000 })
      await acceptTosIfVisible(loginPage, 15000)
      await loginContext.storageState({ path: '.auth/demo2.json' })
    } finally {
      await loginContext.close()
    }

    // Phase 2: Use saved session to visit the invite link
    const context = await browser.newContext({ storageState: '.auth/demo2.json' })
    const freshPage = await context.newPage()

    try {
      // Visit a protected page first to ensure auth middleware refreshes tokens
      await freshPage.goto('/user/home')
      await freshPage.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

      // Navigate to the invite link
      await freshPage.goto(existingUserInviteLink!)
      await freshPage.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

      // Authenticated on the join page — see InvitationUserConfirm
      await expect(freshPage.getByTestId('invite-accept-btn')).toBeVisible({ timeout: 15000 })

      // Accept the invitation
      await freshPage.getByTestId('invite-accept-btn').click()

      // After accepting, the app navigates away from the join page
      await freshPage.waitForURL((url) => !url.pathname.startsWith('/join/'), { timeout: 15000 })
    } finally {
      await context.close()
    }
  })

  test('invite new user to organisation', async () => {
    // Shared page still shows the newly created org
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })

    // LayoutResponsive renders children twice (desktop + mobile); use .first() for desktop
    await page.getByTestId('org-actions-dropdown').first().click()
    await page.getByTestId('org-actions-invite-btn').first().click()

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
    test.setTimeout(90000)
    test.skip(!newUserInviteLink, 'No invitation link from previous test')

    // Phase 1: Register the new user
    const regContext = await browser.newContext()
    const regPage = await regContext.newPage()

    try {
      await regPage.goto('/login')
      await regPage.getByTestId('auth-provider-internal_lasius').click()
      await regPage.waitForURL(/.*\/internal_oauth\/login.*/, { timeout: 10000 })

      await regPage.getByTestId('auth-internal-signup-btn').click()
      await regPage.waitForURL(/.*\/internal_oauth\/register.*/, { timeout: 20000 })

      await regPage.getByTestId('auth-register-email-input').fill(newUserEmail)
      await regPage.getByTestId('auth-register-firstname-input').fill('E2E')
      await regPage.getByTestId('auth-register-lastname-input').fill('User')
      await regPage.getByTestId('auth-register-password-input').fill(newUserPassword)
      await regPage.getByTestId('auth-register-confirmpassword-input').fill(newUserPassword)

      // Submit registration — redirects to login page
      await regPage.getByTestId('auth-register-submit-btn').click()
      await regPage.waitForURL(/.*\/login.*/, { timeout: 15000 })

      // Log in with new credentials and save session state
      await loginAsInternalUser(regPage, newUserEmail, newUserPassword)
      await regPage.waitForURL(/.*\/user\/.*/, { timeout: 30000 })
      await acceptTosIfVisible(regPage)
      await regContext.storageState({ path: '.auth/newuser.json' })
    } finally {
      await regContext.close()
    }

    // Phase 2: Open a new context with the saved session and visit the invite link
    const context = await browser.newContext({ storageState: '.auth/newuser.json' })
    const freshPage = await context.newPage()

    try {
      // Visit a protected page first so the auth middleware refreshes the session token
      await freshPage.goto('/user/home')
      await freshPage.waitForURL(/.*\/user\/.*/, { timeout: 15000 })

      // Visit the invite link as an authenticated user
      await freshPage.goto(newUserInviteLink!)
      await freshPage.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

      // Authenticated on the join page — see InvitationUserConfirm
      await expect(freshPage.getByTestId('invite-accept-btn')).toBeVisible({ timeout: 10000 })

      // Accept the invitation
      await freshPage.getByTestId('invite-accept-btn').click()

      // After accepting, the app navigates away from the join page
      await freshPage.waitForURL((url) => !url.pathname.startsWith('/join/'), { timeout: 15000 })
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
