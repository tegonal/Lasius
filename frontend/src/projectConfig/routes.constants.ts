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

/**
 * Application routes constants
 * Separated from routes.tsx to allow usage in middleware without React dependencies
 */
export const ROUTES = {
  USER: {
    INDEX: '/user/home',
    DASHBOARD: '/user/dashboard',
    STATS: '/user/stats',
    LISTS: '/user/lists',
    PROJECTS: '/user/projects',
  },
  ORGANISATION: {
    CURRENT: '/organisation/current',
    LISTS: '/organisation/lists',
    STATS: '/organisation/stats',
    PROJECTS: '/organisation/projects',
  },
  SETTINGS: {
    APP: '/settings/app',
    ACCOUNT: '/settings/account',
    ACCOUNT_SECURITY: '/settings/account-security',
    WORKING_HOURS: '/settings/working-hours',
  },
}
