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

import {
  Calendar,
  Clock,
  FileText,
  Folder,
  Link2,
  Lock,
  type LucideIcon,
  PieChart,
  Settings,
  SlidersHorizontal,
  Timer,
  User,
  UserCircle,
  Users,
} from 'lucide-react'

import { AUTH_PROVIDER_INTERNAL_LASIUS, ROLES } from '~/config/constants'
import { ROUTES } from '~/config/routes.constants'

export type NavigationRouteType = {
  icon: LucideIcon
  name: string
  restrictTo?: string[]
  route: string
}

export type NavigationSection = {
  icon: LucideIcon
  level: string
  name: string
  routes: NavigationRouteType[]
}

export const NAVIGATION: NavigationSection[] = [
  {
    icon: UserCircle,
    level: 'user',
    name: 'navigation.yourTimeBookingView',
    routes: [
      {
        icon: Timer,
        name: 'bookings.title',
        route: ROUTES.USER.INDEX,
      },
      {
        icon: Calendar,
        name: 'common.dashboard',
        route: ROUTES.USER.DASHBOARD,
      },
      {
        icon: Folder,
        name: 'projects.myProjects',
        route: ROUTES.USER.PROJECTS,
      },
      {
        icon: PieChart,
        name: 'statistics.title',
        route: ROUTES.USER.STATS,
      },
      {
        icon: FileText,
        name: 'lists.title',
        route: ROUTES.USER.LISTS,
      },
    ],
  },
  {
    icon: Users,
    level: 'organisation',
    name: 'navigation.currentOrganisation',
    routes: [
      {
        icon: Users,
        name: 'organisation.title',
        route: ROUTES.ORGANISATION.CURRENT,
      },
      {
        icon: Folder,
        name: 'projects.title',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.PROJECTS,
      },
      {
        icon: PieChart,
        name: 'statistics.title',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.STATS,
      },
      {
        icon: FileText,
        name: 'lists.title',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.LISTS,
      },
      {
        icon: Link2,
        name: 'integrations.title',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.INTEGRATIONS,
      },
    ],
  },
  {
    icon: Settings,
    level: 'settings',
    name: 'account.changeUserProfileSettings',
    routes: [
      {
        icon: SlidersHorizontal,
        name: 'settings.app.menuTitle',
        route: ROUTES.SETTINGS.APP,
      },
      {
        icon: User,
        name: 'account.title',
        route: ROUTES.SETTINGS.ACCOUNT,
      },
      {
        icon: Lock,
        name: 'account.accountSecurity',
        restrictTo: [AUTH_PROVIDER_INTERNAL_LASIUS],
        route: ROUTES.SETTINGS.ACCOUNT_SECURITY,
      },
      {
        icon: Clock,
        name: 'workingHours.title',
        route: ROUTES.SETTINGS.WORKING_HOURS,
      },
    ],
  },
]

export const getNavigation = ({
  id,
  isOrganisationAdministrator,
  isUserOfInternalOAuthProvider,
}: {
  id: string
  isOrganisationAdministrator: boolean
  isUserOfInternalOAuthProvider: boolean
}) => {
  const section = NAVIGATION.find((item) => item.level === id)
  if (!section) return []

  return section.routes.filter((item) => {
    return (
      !item.restrictTo ||
      (item.restrictTo.includes(ROLES.ORGANISATION_ADMIN) &&
        isOrganisationAdministrator) ||
      (item.restrictTo.includes(AUTH_PROVIDER_INTERNAL_LASIUS) &&
        isUserOfInternalOAuthProvider)
    )
  })
}
