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

import auth from './fr/auth.json'
import bookingHistory from './fr/booking-history.json'
import bookings from './fr/bookings.json'
import calendar from './fr/calendar.json'
import common from './fr/common.json'
import contextMenu from './fr/context-menu.json'
import dashboard from './fr/dashboard.json'
import features from './fr/features.json'
import help from './fr/help.json'
import home from './fr/home.json'
import integrations from './fr/integrations.json'
import invitation from './fr/invitation.json'
import navigation from './fr/navigation.json'
import onboarding from './fr/onboarding.json'
import organisation from './fr/organisation.json'
import projects from './fr/projects.json'
import settings from './fr/settings.json'
import stats from './fr/stats.json'
import system from './fr/system.json'
import tagManager from './fr/tag-manager.json'
import workingHours from './fr/working-hours.json'

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
