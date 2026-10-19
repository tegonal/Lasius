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

import { useLocation, useNavigate } from 'react-router'

import {
  getNavigation,
  type NavigationRouteType,
  type NavigationSection,
} from '~/config/navigation'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'

/** The pages of one navigation section that the current user may open. */
export const useSectionRoutes = (
  branch: string,
  navigation: NavigationSection[],
): NavigationRouteType[] => {
  const { isAdministrator } = useOrganisation()
  const loaderData = useLayoutLoaderData()

  return getNavigation({
    id: branch,
    isOrganisationAdministrator: isAdministrator,
    isUserOfInternalOAuthProvider: loaderData?.tokenIssuer === 'internal',
    navigation,
  })
}

/** Navigate to a navigation page. The selected ?date= goes with it. */
export const useNavigateToRoute = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (route: string) => location.pathname === route

  const navigateTo = (route: string) => {
    const dateParameter = new URLSearchParams(location.search).get('date')
    const search = dateParameter ? `?date=${dateParameter}` : ''
    void navigate(`${route}${search}`)
  }

  return { isActive, navigateTo }
}
