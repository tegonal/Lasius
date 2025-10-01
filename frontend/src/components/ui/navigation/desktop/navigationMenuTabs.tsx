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

import { IconTabs, IconTabsItem } from 'components/ui/navigation/IconTabs'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { NAVIGATION } from 'projectConfig/routes'
import React from 'react'

export const NavigationMenuTabs: React.FC = () => {
  const router = useRouter()
  const { t } = useTranslation('common')

  const tabs: IconTabsItem[] = NAVIGATION.map((item) => ({
    id: item.level,
    name: t(item.name as any),
    component: item.component,
    icon: item.icon,
    routes: item.routes.map((r) => r.route),
  }))

  // Determine initial tab based on current route
  const getInitialTab = () => {
    const currentPath = router.pathname
    for (let i = 0; i < NAVIGATION.length; i++) {
      const hasMatchingRoute = NAVIGATION[i].routes.some(
        (route) => currentPath.startsWith(route.route.split('[')[0]), // Handle dynamic routes
      )
      if (hasMatchingRoute) return i
    }
    return 0 // Default to first tab
  }

  return (
    <div className="h-full w-full pt-4 pr-3">
      <IconTabs tabs={tabs} position="left" initialTab={getInitialTab()} />
    </div>
  )
}
