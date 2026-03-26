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

import { type TFunction } from 'i18next'
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

export const createNavigation = (
  t: TFunction<'navigation'>,
): NavigationSection[] => [
  {
    icon: UserCircle,
    level: 'user',
    name: t('tabs.user', 'Your time booking view'),
    routes: [
      {
        icon: Timer,
        name: t('user.bookings', 'Bookings'),
        route: ROUTES.USER.INDEX,
      },
      {
        icon: Calendar,
        name: t('user.dashboard', 'Dashboard'),
        route: ROUTES.USER.DASHBOARD,
      },
      {
        icon: Folder,
        name: t('user.projects', 'My projects'),
        route: ROUTES.USER.PROJECTS,
      },
      {
        icon: PieChart,
        name: t('user.stats', 'Statistics'),
        route: ROUTES.USER.STATS,
      },
      {
        icon: FileText,
        name: t('user.lists', 'Lists'),
        route: ROUTES.USER.LISTS,
      },
    ],
  },
  {
    icon: Users,
    level: 'organisation',
    name: t('tabs.organisation', 'Current organisation'),
    routes: [
      {
        icon: Users,
        name: t('organisation.current', 'Organisation'),
        route: ROUTES.ORGANISATION.CURRENT,
      },
      {
        icon: Folder,
        name: t('organisation.projects', 'Projects'),
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.PROJECTS,
      },
      {
        icon: PieChart,
        name: t('organisation.stats', 'Statistics'),
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.STATS,
      },
      {
        icon: FileText,
        name: t('organisation.lists', 'Lists'),
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.LISTS,
      },
      {
        icon: Link2,
        name: t('organisation.integrations', 'Integrations'),
        restrictTo: [ROLES.ORGANISATION_ADMIN],
        route: ROUTES.ORGANISATION.INTEGRATIONS,
      },
    ],
  },
  {
    icon: Settings,
    level: 'settings',
    name: t('tabs.settings', 'Settings'),
    routes: [
      {
        icon: SlidersHorizontal,
        name: t('settings.app', 'App Settings'),
        route: ROUTES.SETTINGS.APP,
      },
      {
        icon: User,
        name: t('settings.account', 'Account'),
        route: ROUTES.SETTINGS.ACCOUNT,
      },
      {
        icon: Lock,
        name: t('settings.accountSecurity', 'Account Security'),
        restrictTo: [AUTH_PROVIDER_INTERNAL_LASIUS],
        route: ROUTES.SETTINGS.ACCOUNT_SECURITY,
      },
      {
        icon: Clock,
        name: t('settings.workingHours', 'Working hours'),
        route: ROUTES.SETTINGS.WORKING_HOURS,
      },
    ],
  },
]

export const getNavigation = ({
  id,
  isOrganisationAdministrator,
  isUserOfInternalOAuthProvider,
  navigation,
}: {
  id: string
  isOrganisationAdministrator: boolean
  isUserOfInternalOAuthProvider: boolean
  navigation: NavigationSection[]
}) => {
  const section = navigation.find((item) => item.level === id)
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
