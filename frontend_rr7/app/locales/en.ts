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

import auth from './en/auth.json'
import bookingHistory from './en/booking-history.json'
import bookings from './en/bookings.json'
import calendar from './en/calendar.json'
import common from './en/common.json'
import contextMenu from './en/context-menu.json'
import dashboard from './en/dashboard.json'
import features from './en/features.json'
import help from './en/help.json'
import home from './en/home.json'
import integrations from './en/integrations.json'
import invitation from './en/invitation.json'
import navigation from './en/navigation.json'
import onboarding from './en/onboarding.json'
import organisation from './en/organisation.json'
import projects from './en/projects.json'
import settings from './en/settings.json'
import stats from './en/stats.json'
import system from './en/system.json'
import tagManager from './en/tag-manager.json'
import workingHours from './en/working-hours.json'

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
