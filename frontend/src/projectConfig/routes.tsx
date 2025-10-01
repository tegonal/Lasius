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

import { NavigationTabContent } from 'components/features/navigation/navigationTabContent'
import {
  Calendar,
  Clock,
  FileText,
  Folder,
  FolderCog,
  Lock,
  LucideIcon,
  PieChart,
  Settings,
  SlidersHorizontal,
  Timer,
  User,
  UserCircle,
  Users,
} from 'lucide-react'
import { AUTH_PROVIDER_INTERNAL_LASIUS, ROLES } from 'projectConfig/constants'
import React from 'react'

const t = (key: string, _options?: { defaultValue?: string }) => key

export const ROUTES = {
  USER: {
    INDEX: '/user/home',
    SUMMARY: '/user/summary',
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

export type NavigationRouteType = {
  route: string
  name: string
  icon: LucideIcon
  restrictTo?: string[]
}

export type NavigationType = {
  level: string
  component: React.ReactNode
  icon: LucideIcon
  routes: NavigationRouteType[]
  name: string
}[]

export const NAVIGATION: NavigationType = [
  {
    level: 'user',
    component: <NavigationTabContent branch="user" />,
    icon: UserCircle,
    name: t('navigation.yourTimeBookingView', { defaultValue: 'Your time booking view' }),
    routes: [
      {
        route: ROUTES.USER.INDEX,
        name: t('bookings.title', { defaultValue: 'Bookings' }),
        icon: Timer,
      },
      {
        route: ROUTES.USER.PROJECTS,
        name: t('projects.myProjects', { defaultValue: 'My projects' }),
        icon: Folder,
      },
      {
        route: ROUTES.USER.SUMMARY,
        name: t('common.summary', { defaultValue: 'Summary' }),
        icon: Calendar,
      },
      {
        route: ROUTES.USER.STATS,
        name: t('statistics.title', { defaultValue: 'Statistics' }),
        icon: PieChart,
      },
      {
        route: ROUTES.USER.LISTS,
        name: t('lists.title', { defaultValue: 'Lists' }),
        icon: FileText,
      },
    ],
  },
  {
    level: 'organisation',
    component: <NavigationTabContent branch="organisation" />,
    icon: Users,
    name: t('navigation.viewOrganisations', { defaultValue: 'View organisations and manage them' }),
    routes: [
      {
        route: ROUTES.ORGANISATION.CURRENT,
        name: t('organisations.currentOrganisation', { defaultValue: 'Current organisation' }),
        icon: Users,
      },
      {
        route: ROUTES.ORGANISATION.PROJECTS,
        name: t('projects.allProjects', { defaultValue: 'All projects' }),
        icon: FolderCog,
        restrictTo: [ROLES.ORGANISATION_ADMIN],
      },
      {
        route: ROUTES.ORGANISATION.LISTS,
        name: t('lists.title', { defaultValue: 'Lists' }),
        icon: FileText,
        restrictTo: [ROLES.ORGANISATION_ADMIN],
      },
      {
        route: ROUTES.ORGANISATION.STATS,
        name: t('statistics.title', { defaultValue: 'Statistics' }),
        icon: PieChart,
        restrictTo: [ROLES.ORGANISATION_ADMIN],
      },
    ],
  },
  {
    level: 'settings',
    component: <NavigationTabContent branch="settings" />,
    icon: Settings,
    name: t('account.changeUserProfileSettings', { defaultValue: 'Change user profile settings' }),
    routes: [
      {
        route: ROUTES.SETTINGS.APP,
        name: t('settings.app.menuTitle', { defaultValue: 'App Settings' }),
        icon: SlidersHorizontal,
      },
      {
        route: ROUTES.SETTINGS.ACCOUNT,
        name: t('account.title', { defaultValue: 'Account' }),
        icon: User,
      },
      {
        route: ROUTES.SETTINGS.ACCOUNT_SECURITY,
        name: t('account.accountSecurity', { defaultValue: 'Account Security' }),
        icon: Lock,
        restrictTo: [AUTH_PROVIDER_INTERNAL_LASIUS],
      },
      {
        route: ROUTES.SETTINGS.WORKING_HOURS,
        name: t('workingHours.title', { defaultValue: 'Working hours' }),
        icon: Clock,
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
  const branch = NAVIGATION.filter((item) => item.level === id)[0].routes
  return branch.filter((item) => {
    return (
      !item.restrictTo ||
      (item.restrictTo?.includes(ROLES.ORGANISATION_ADMIN) && isOrganisationAdministrator) ||
      (item.restrictTo?.includes(AUTH_PROVIDER_INTERNAL_LASIUS) && isUserOfInternalOAuthProvider)
    )
  })
}
