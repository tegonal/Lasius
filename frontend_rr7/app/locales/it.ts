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

import auth from './it/auth.json'
import bookingHistory from './it/booking-history.json'
import bookings from './it/bookings.json'
import calendar from './it/calendar.json'
import common from './it/common.json'
import contextMenu from './it/context-menu.json'
import dashboard from './it/dashboard.json'
import help from './it/help.json'
import home from './it/home.json'
import integrations from './it/integrations.json'
import invitation from './it/invitation.json'
import navigation from './it/navigation.json'
import onboarding from './it/onboarding.json'
import organisation from './it/organisation.json'
import projects from './it/projects.json'
import settings from './it/settings.json'
import stats from './it/stats.json'
import system from './it/system.json'
import tagManager from './it/tag-manager.json'
import workingHours from './it/working-hours.json'

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
  onboarding,
  organisation,
  projects,
  settings,
  stats,
  system,
  'tag-manager': tagManager,
  'working-hours': workingHours,
} as const
