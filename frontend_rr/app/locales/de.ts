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

import auth from './de/auth.json'
import bookingHistory from './de/booking-history.json'
import bookings from './de/bookings.json'
import calendar from './de/calendar.json'
import common from './de/common.json'
import contextMenu from './de/context-menu.json'
import dashboard from './de/dashboard.json'
import features from './de/features.json'
import help from './de/help.json'
import home from './de/home.json'
import integrations from './de/integrations.json'
import invitation from './de/invitation.json'
import navigation from './de/navigation.json'
import onboarding from './de/onboarding.json'
import organisation from './de/organisation.json'
import projects from './de/projects.json'
import settings from './de/settings.json'
import stats from './de/stats.json'
import system from './de/system.json'
import tagManager from './de/tag-manager.json'
import workingHours from './de/working-hours.json'

export default {
  auth,
  'booking-history': bookingHistory,
  bookings,
  calendar,
  common,
  'context-menu': contextMenu,
  dashboard,
  features,
  help,
  home,
  integrations,
  invitation,
  navigation,
  onboarding,
  organisation,
  projects,
  settings,
  stats,
  system,
  'tag-manager': tagManager,
  'working-hours': workingHours,
} as const
