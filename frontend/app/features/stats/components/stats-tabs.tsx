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

import { useRef } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router'

import { SlidingIndicator } from '~/components/ui/animations/sliding-indicator'
import { cn } from '~/lib/utils/cn'

type StatsTab = {
  id: string
  label: string
  to: string
}

type StatsTabsProperties = {
  tabs: StatsTab[]
}

export const StatsTabs = ({ tabs }: StatsTabsProperties) => {
  const [searchParameters] = useSearchParams()
  const location = useLocation()
  const itemReferences = useRef<(HTMLElement | null)[]>([])

  const preservedParameters = new URLSearchParams()
  const from = searchParameters.get('from')
  const to = searchParameters.get('to')
  const dateRange = searchParameters.get('dateRange')
  if (from) preservedParameters.set('from', from)
  if (to) preservedParameters.set('to', to)
  if (dateRange) preservedParameters.set('dateRange', dateRange)
  const search = preservedParameters.size > 0 ? `?${preservedParameters}` : ''

  const selectedIndex = tabs.findIndex((tab) => location.pathname.endsWith(tab.to))

  return (
    <div className="border-base-content/20 relative flex flex-shrink-0 flex-row justify-start gap-3 border-b">
      <SlidingIndicator
        className="!top-auto !bottom-0 !h-[2px]"
        itemRefs={itemReferences}
        radiusOn="bottom"
        selectedIndex={selectedIndex}
      />
      {tabs.map((tab, index) => (
        <div
          className="relative z-10"
          key={tab.to}
          ref={(element) => {
            itemReferences.current[index] = element
          }}>
          <NavLink
            className={({ isActive }) =>
              cn(
                'btn btn-ghost relative z-20 rounded-none hover:bg-transparent hover:shadow-[inset_0_-2px_0_0_currentColor]',
                isActive ? 'text-base-content' : 'text-base-content/60',
              )
            }
            data-testid={`stats-tab-${tab.id}`}
            to={`${tab.to}${search}`}>
            {tab.label}
          </NavLink>
        </div>
      ))}
    </div>
  )
}
