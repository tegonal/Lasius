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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import {
  IconTabs,
  type IconTabsItem,
} from '~/components/ui/navigation/icon-tabs'
import { NAVIGATION } from '~/config/navigation'
import { NavigationTabContent } from '~/features/navigation/components/navigation-tab-content'

export const NavigationMenuTabs = () => {
  const { t } = useTranslation('common')
  const location = useLocation()

  // Derive the tab that matches the current URL; fall back to manual override
  const locationTab = tabIndexForPath(location.pathname)
  const [manualTab, setManualTab] = useState<null | number>(null)

  // Reset manual override when URL changes to a different section
  const selected =
    manualTab !== null && manualTab !== locationTab ? manualTab : locationTab

  const tabs: IconTabsItem[] = NAVIGATION.map((item) => ({
    component: <NavigationTabContent branch={item.level} />,
    icon: item.icon,
    id: item.level,
    name: t(item.name),
    routes: item.routes.map((r) => r.route),
  }))

  return (
    <div className="h-full w-full px-2 pt-1 lg:px-4 lg:pt-4 xl:px-6 xl:pt-6">
      <IconTabs
        onSelect={setManualTab}
        position="left"
        selected={selected}
        tabs={tabs}
      />
    </div>
  )
}

/** Find the NAVIGATION section index whose routes match the given pathname. */
export const tabIndexForPath = (pathname: string): number => {
  for (let i = 0; i < NAVIGATION.length; i++) {
    const hasMatch = NAVIGATION[i]?.routes.some((route) =>
      pathname.startsWith(route.route),
    )
    if (hasMatch) return i
  }
  return 0
}
