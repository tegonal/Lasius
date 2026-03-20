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

import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  outputDir: './test-results',
  // Dev server needs extra time for cold SSR compilation + auth middleware
  timeout: process.env.CI ? 30000 : 60000,

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: 'keycloak-setup',
      testMatch: /.*auth-keycloak\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: [/.*\.unauth\.spec\.ts/, /.*keycloak\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'keycloak',
      testMatch: /.*keycloak\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/keycloak-user.json',
      },
      dependencies: ['keycloak-setup'],
    },
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
