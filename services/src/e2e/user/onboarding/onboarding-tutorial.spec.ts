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

const SETTINGS_KEY = 'lasius-app-settings'

// auth.setup.ts stores a dismissed tutorial. Each test starts with a fresh tutorial once per tab,
// so a reload keeps what the tutorial itself wrote.
test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('onboarding-e2e-init')) return
    sessionStorage.setItem('onboarding-e2e-init', '1')
    localStorage.setItem(
      key,
      JSON.stringify({
        state: { onboardingChecklistReached: false, onboardingDismissed: false },
        version: 0,
      }),
    )
  }, SETTINGS_KEY)
  await page.goto('/user/home')
  await expect(page.getByTestId('onboarding-slide')).toBeVisible({ timeout: 15000 })
})

const slideId = (page: Page) => page.getByTestId('onboarding-slide')

const storedSettings = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').state ?? {}, SETTINGS_KEY)

// The tutorial renders only after hydration, so one click is enough. A retry would skip a slide.
const clickToSlide = async (page: Page, testId: string, expectedSlide: string) => {
  await page.getByTestId(testId).click()
  await expect(slideId(page)).toHaveAttribute('data-slide-id', expectedSlide)
}

test.describe('Onboarding tutorial', () => {
  test('Next and Back move one slide, and Back is disabled on the first slide', async ({
    page,
  }) => {
    await expect(slideId(page)).toHaveAttribute('data-slide-id', 'overview')
    await expect(page.getByTestId('onboarding-back-btn')).toBeDisabled()
    await expect(page.getByTestId('onboarding-counter')).toHaveText(/^1 \/ 8$/)

    await clickToSlide(page, 'onboarding-next-btn', 'navigation')
    await expect(page.getByTestId('onboarding-counter')).toHaveText(/^2 \/ 8$/)
    await clickToSlide(page, 'onboarding-back-btn', 'overview')
  })

  test('the checklist slide stores its flag, and a reload starts there', async ({ page }) => {
    await clickToSlide(page, 'onboarding-next-btn', 'navigation')
    await clickToSlide(page, 'onboarding-next-btn', 'checklist')
    await expect
      .poll(async () => (await storedSettings(page)).onboardingChecklistReached)
      .toBe(true)

    await page.reload()
    await expect(slideId(page)).toHaveAttribute('data-slide-id', 'checklist', { timeout: 15000 })
  })

  test('a checklist item opens its slide, and Back returns to the checklist', async ({ page }) => {
    await clickToSlide(page, 'onboarding-dot-checklist', 'checklist')
    await clickToSlide(page, 'onboarding-checklist-projects', 'projects')
    await clickToSlide(page, 'onboarding-back-btn', 'checklist')
  })

  test('the last slide dismisses the tutorial for good', async ({ page }) => {
    await clickToSlide(page, 'onboarding-dot-booking', 'booking')
    // The booking slide is last only when it is the last incomplete slide, so walk to the end.
    while (await page.getByTestId('onboarding-next-btn').isVisible()) {
      await page.getByTestId('onboarding-next-btn').click()
    }
    await page.getByTestId('onboarding-done-btn').click()
    await expect(slideId(page)).toBeHidden()
    expect((await storedSettings(page)).onboardingDismissed).toBe(true)
  })

  test('the close button asks first, and Ok dismisses the tutorial', async ({ page }) => {
    await expect(async () => {
      await page.getByTestId('onboarding-close-btn').click()
      await expect(page.getByTestId('confirm-modal-confirm-btn')).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 15000 })
    await page.getByTestId('confirm-modal-confirm-btn').click()
    await expect(slideId(page)).toBeHidden()
    expect((await storedSettings(page)).onboardingDismissed).toBe(true)
  })
})
