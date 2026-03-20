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
const orgName = `E2E KC Org ${timestamp}`
const newUserEmail = `e2e-kc-newuser-${timestamp}@lasius.ch`
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
 * Force Keycloak to show the login form even if an SSO session exists.
 *
 * The keycloak-setup project creates a Keycloak SSO session (AUTH_SESSION_ID
 * cookie on localhost). Because cookie domains ignore ports, this session
 * persists server-side and auto-authenticates subsequent requests to
 * localhost:8080 — even from isolated browser contexts.
 *
 * Adding prompt=login to the OIDC authorization URL is the standard way to
 * force re-authentication regardless of existing sessions.
 */
async function forceKeycloakLoginPrompt(page: Page) {
  await page.route('**/realms/lasius/protocol/openid-connect/auth**', async (route) => {
    const url = new URL(route.request().url())
    url.searchParams.set('prompt', 'login')
    await route.continue({ url: url.toString() })
  })
}

/**
 * Log in via Keycloak from the login page.
 * Navigates through the external Keycloak login form at localhost:8080.
 *
 * Note: Keycloak's external UI does not have data-testid attributes —
 * getByLabel/getByRole/locator selectors are the correct approach for third-party UIs.
 */
async function loginAsKeycloakUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByTestId('auth-provider-custom_keycloak').click()
  await page.waitForURL(/.*localhost:8080.*/, { timeout: 15000 })
  await page.getByLabel('Email').fill(email)
  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/.*localhost:3000\/user\/.*/, { timeout: 30000 })
}

/**
 * Poll Mailpit API for the verification email sent to the given address.
 * Returns the verification link extracted from the email body.
 */
async function pollMailpitForVerificationLink(
  recipientEmail: string,
  maxAttempts = 10,
  intervalMs = 1000,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const searchResponse = await fetch(
      `http://localhost:8025/api/v1/search?query=to:${encodeURIComponent(recipientEmail)}&limit=1`,
    )
    const searchData = await searchResponse.json()

    if (searchData.messages && searchData.messages.length > 0) {
      const messageId = searchData.messages[0].ID

      // Fetch the full message to get the HTML body
      const msgResponse = await fetch(`http://localhost:8025/api/v1/message/${messageId}`)
      const msgData = await msgResponse.json()

      // Extract verification link from HTML body
      const html = msgData.HTML || ''
      const linkMatch = html.match(/href="(http[^"]*action-token[^"]*)"/)
      if (linkMatch) {
        return linkMatch[1]
      }

      // Try plain text body as fallback
      const text = msgData.Text || ''
      const textLinkMatch = text.match(/(http\S*action-token\S*)/)
      if (textLinkMatch) {
        return textLinkMatch[1]
      }

      throw new Error(
        `Verification email found but no action-token link in body for ${recipientEmail}`,
      )
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`No verification email found for ${recipientEmail} after ${maxAttempts} attempts`)
}

/**
 * Register a new user via Keycloak's native registration form.
 * After registration, Keycloak shows a "verify your email" page because
 * verifyEmail is enabled in the realm. We fetch the verification link
 * from Mailpit and navigate to it.
 */
async function registerViaKeycloak(
  page: Page,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  await page.goto('/login')
  await page.getByTestId('auth-provider-custom_keycloak').click()
  await page.waitForURL(/.*localhost:8080.*/, { timeout: 15000 })

  // Click "Register" link on Keycloak login page
  await page.getByRole('link', { name: /register/i }).click()

  // Fill Keycloak registration form
  await page.getByLabel('First name').fill(firstName)
  await page.getByLabel('Last name').fill(lastName)
  await page.getByLabel('Email').fill(email)
  await page.locator('input#password').fill(password)
  await page.locator('input#password-confirm').fill(password)

  // Submit registration
  await page.getByRole('button', { name: /register/i }).click()

  // Keycloak shows "verify your email" page — fetch link from Mailpit
  const verificationLink = await pollMailpitForVerificationLink(email)
  await page.goto(verificationLink)

  // After verification, Keycloak redirects back to the app
  await page.waitForURL(/.*localhost:3000\/user\/.*/, { timeout: 30000 })
}

test.describe.serial('Keycloak Organisation + Invitation lifecycle @org @keycloak', () => {
  let page: Page
  let existingUserInviteLink: string | null = null
  let newUserInviteLink: string | null = null

  test.beforeAll(async ({ browser }) => {
    // Shared page with Keycloak auth state — persists org selection across tests
    const context = await browser.newContext({ storageState: '.auth/keycloak-user.json' })
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await page?.context().close()
  })

  test('create organisation', async () => {
    test.setTimeout(90000)
    await page.goto('/organisation/current')
    await page.waitForURL(/.*\/organisation\/current.*/, { timeout: 15000 })
    await acceptTosIfVisible(page)

    // LayoutResponsive renders children twice (desktop + mobile); use .first() for desktop
    await page.getByTestId('org-actions-dropdown').first().click()
    await page.getByTestId('org-actions-create-btn').first().click()

    // Wait for the form to appear, then fill org name and submit
    const nameInput = page.getByTestId('org-form-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(orgName)
    await page.getByTestId('org-form-submit-btn').click()

    // Wait for the modal to close
    await nameInput.waitFor({ state: 'hidden', timeout: 10000 })

    // On first use with a fresh Keycloak user, the OrganisationStore's syncFromProfile
    // may revert to the private org due to a race condition: stale profile data (cached
    // before the org was created) triggers fallback logic before the fresh profile loads.
    // Additionally, syncFromProfile triggers window.location.reload() on first org setup.
    //
    // Wait for the page to settle after any auto-reloads, then check if we need to
    // manually switch to the new org via the header org selector.
    await page.waitForTimeout(3000)
    await page.waitForLoadState('load', { timeout: 15000 })

    const orgAlreadyVisible = await page
      .getByText(orgName)
      .first()
      .isVisible()
      .catch(() => false)
    if (!orgAlreadyVisible) {
      // The org switch didn't persist. Select the org via the org selector button
      // (SelectUserOrganisation component), which opens a modal listing all orgs.
      const orgSelectorBtn = page.getByTestId('org-selector-btn')
      await orgSelectorBtn.waitFor({ state: 'visible', timeout: 15000 })
      await orgSelectorBtn.click()

      // Click on our org in the modal list
      const orgOption = page.getByText(orgName).first()
      await orgOption.waitFor({ state: 'visible', timeout: 10000 })
      await orgOption.click()

      // Wait for the org page to reload with the new org
      await page.waitForLoadState('networkidle', { timeout: 10000 })
    }

    // Verify the org name appears on the page (dynamic test data, not a translation)
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 15000 })
  })

  test('invite existing user to organisation', async () => {
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10000 })

    // LayoutResponsive renders children twice (desktop + mobile); use .first() for desktop
    await page.getByTestId('org-actions-dropdown').first().click()
    await page.getByTestId('org-actions-invite-btn').first().click()

    // Fill email and submit
    await page.getByTestId('org-invite-email-input').fill('e2e2@lasius.ch')
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

    // Use the shared page (logged in as e2e) to visit e2e2's invite link
    await page.goto(existingUserInviteLink!)
    await page.waitForURL(/.*\/join\/.*/, { timeout: 15000 })

    // e2e email does not match the invite's target (e2e2) → InvitationOtherSession
    await expect(page.getByTestId('invite-other-session')).toBeVisible({ timeout: 15000 })

    // Navigate back to the org page for subsequent tests
    await page.goto('/organisation/current')
    await page.waitForURL(/.*\/organisation\/current.*/, { timeout: 15000 })
  })

  test('existing user accepts organisation invitation', async ({ browser }) => {
    test.setTimeout(120000)
    test.skip(!existingUserInviteLink, 'No invitation link — user was assigned directly')

    // Phase 1: Login as e2e2 via Keycloak in a fresh context.
    // Explicitly clear storageState — browser.newContext() in the keycloak project
    // inherits storageState from the project config, which includes Keycloak SSO
    // cookies that would auto-authenticate as e2e@lasius.ch.
    const loginContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const loginPage = await loginContext.newPage()

    try {
      await forceKeycloakLoginPrompt(loginPage)
      await loginAsKeycloakUser(loginPage, 'e2e2@lasius.ch', 'e2e-test')
      await acceptTosIfVisible(loginPage, 15000)
      await loginContext.storageState({ path: '.auth/keycloak-e2e2.json' })
    } finally {
      await loginContext.close()
    }

    // Phase 2: Use saved session to visit the invite link
    const context = await browser.newContext({ storageState: '.auth/keycloak-e2e2.json' })
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

  test('new user registers via Keycloak and accepts invitation', async ({ browser }) => {
    test.setTimeout(120000)
    test.skip(!newUserInviteLink, 'No invitation link from previous test')

    // Phase 1: Register the new user via Keycloak (includes email verification via Mailpit).
    // Explicitly clear storageState to avoid inheriting Keycloak SSO cookies.
    const regContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const regPage = await regContext.newPage()

    try {
      await forceKeycloakLoginPrompt(regPage)
      await registerViaKeycloak(regPage, newUserEmail, newUserPassword, 'E2E', 'KCUser')
      await acceptTosIfVisible(regPage)
      await regContext.storageState({ path: '.auth/keycloak-newuser.json' })
    } finally {
      await regContext.close()
    }

    // Phase 2: Open a new context with the saved session and visit the invite link
    const context = await browser.newContext({ storageState: '.auth/keycloak-newuser.json' })
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
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
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
