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
import { AUTH_PROVIDER_INTERNAL_LASIUS, ROLES } from 'projectConfig/constants'
import React from 'react'
import { IconNames } from 'types/iconNames'

const t = (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key

export const ROUTES = {
  USER: {
    INDEX: '/user/home',
    THIS_MONTH: '/user/this-month',
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
    ACCOUNT: '/settings/account',
    ACCOUNT_SECURITY: '/settings/account-security',
    WORKING_HOURS: '/settings/working-hours',
  },
}

export type NavigationRouteType = {
  route: string
  name: string
  icon: IconNames
  restrictTo?: string[]
}

export type NavigationType = {
  level: string
  component: React.ReactNode
  icon: IconNames
  routes: NavigationRouteType[]
  name: string
}[]

export const NAVIGATION: NavigationType = [
  {
    level: 'user',
    component: <NavigationTabContent branch="user" />,
    icon: 'single-neutral-circle-users',
    name: t('navigation.yourTimeBookingView', { defaultValue: 'Your time booking view' }),
    routes: [
      {
        route: ROUTES.USER.INDEX,
        name: t('bookings.title', { defaultValue: 'Bookings' }),
        icon: 'stopwatch-interface-essential',
      },
      {
        route: ROUTES.USER.PROJECTS,
        name: t('projects.myProjects', { defaultValue: 'My projects' }),
        icon: 'folder-files-folders',
      },
      {
        route: ROUTES.USER.THIS_MONTH,
        name: t('common.time.thisMonth', { defaultValue: 'This month' }),
        icon: 'calendar-1-interface-essential',
      },
      {
        route: ROUTES.USER.STATS,
        name: t('statistics.title', { defaultValue: 'Statistics' }),
        icon: 'pie-line-graph-interface-essential',
      },
      {
        route: ROUTES.USER.LISTS,
        name: t('lists.title', { defaultValue: 'Lists' }),
        icon: 'filter-text-interface-essential',
      },
    ],
  },
  {
    level: 'organisation',
    component: <NavigationTabContent branch="organisation" />,
    icon: 'human-resources-search-team-work-office-companies',
    name: t('navigation.viewOrganizations', { defaultValue: 'View organisations and manage them' }),
    routes: [
      {
        route: ROUTES.ORGANISATION.CURRENT,
        name: t('organizations.currentOrganization', { defaultValue: 'Current organisation' }),
        icon: 'human-resources-search-team-work-office-companies',
      },
      {
        route: ROUTES.ORGANISATION.PROJECTS,
        name: t('projects.allProjects', { defaultValue: 'All projects' }),
        icon: 'folder-settings-files-folders',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
      },
      {
        route: ROUTES.ORGANISATION.LISTS,
        name: t('lists.title', { defaultValue: 'Lists' }),
        icon: 'filter-text-interface-essential',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
      },
      {
        route: ROUTES.ORGANISATION.STATS,
        name: t('statistics.title', { defaultValue: 'Statistics' }),
        icon: 'pie-line-graph-interface-essential',
        restrictTo: [ROLES.ORGANISATION_ADMIN],
      },
    ],
  },
  {
    level: 'settings',
    component: <NavigationTabContent branch="settings" />,
    icon: 'cog-interface-essential',
    name: t('account.changeUserProfileSettings', { defaultValue: 'Change user profile settings' }),
    routes: [
      {
        route: ROUTES.SETTINGS.ACCOUNT,
        name: t('account.title', { defaultValue: 'Account' }),
        icon: 'single-neutral-profile-picture-users',
      },
      {
        route: ROUTES.SETTINGS.ACCOUNT_SECURITY,
        name: t('account.accountSecurity', { defaultValue: 'Account Security' }),
        icon: 'lock-1-interface-essential',
        restrictTo: [AUTH_PROVIDER_INTERNAL_LASIUS],
      },
      {
        route: ROUTES.SETTINGS.WORKING_HOURS,
        name: t('workingHours.title', { defaultValue: 'Working hours' }),
        icon: 'single-neutral-actions-time-users',
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
