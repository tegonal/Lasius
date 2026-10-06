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

import { useLocation, useSearchParams } from 'react-router'

import { UnderlineTabs } from '~/components/ui/navigation/underline-tabs'
import { getStatsTabSearch } from '~/features/stats/lib/stats-tab-search'

type StatsTab = {
  id: string
  label: string
  params?: Record<string, string>
  to: string
}

type StatsTabsProperties = {
  selectedId?: string
  tabs: StatsTab[]
}

export const StatsTabs = ({ selectedId, tabs }: StatsTabsProperties) => {
  const [searchParameters] = useSearchParams()
  const location = useLocation()

  const selectedIndex = selectedId
    ? tabs.findIndex((tab) => tab.id === selectedId)
    : tabs.findIndex((tab) => location.pathname.endsWith(tab.to))

  return (
    <UnderlineTabs
      selectedIndex={selectedIndex}
      tabs={tabs.map((tab) => ({
        href: `${tab.to}${getStatsTabSearch(searchParameters, tab.params)}`,
        id: tab.id,
        label: tab.label,
      }))}
      testIdPrefix="stats-tab"
    />
  )
}
