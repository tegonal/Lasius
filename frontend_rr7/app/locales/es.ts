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

import auth from './es/auth.json'
import bookingHistory from './es/booking-history.json'
import bookings from './es/bookings.json'
import calendar from './es/calendar.json'
import common from './es/common.json'
import contextMenu from './es/context-menu.json'
import dashboard from './es/dashboard.json'
import help from './es/help.json'
import home from './es/home.json'
import integrations from './es/integrations.json'
import invitation from './es/invitation.json'
import navigation from './es/navigation.json'
import organisation from './es/organisation.json'
import projects from './es/projects.json'
import settings from './es/settings.json'
import stats from './es/stats.json'
import system from './es/system.json'
import tagManager from './es/tag-manager.json'
import workingHours from './es/working-hours.json'

export default {
  auth,
  'booking-history': bookingHistory,
  bookings,
  calendar,
  common,
  'context-menu': contextMenu,
  dashboard,
  help,
  home,
  integrations,
  invitation,
  navigation,
  organisation,
  projects,
  settings,
  stats,
  system,
  'tag-manager': tagManager,
  'working-hours': workingHours,
} as const
