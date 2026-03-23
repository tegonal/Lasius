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

type StatsTabsProps = {
  tabs: StatsTab[]
}

export const StatsTabs = ({ tabs }: StatsTabsProps) => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  const preservedParams = new URLSearchParams()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const dateRange = searchParams.get('dateRange')
  if (from) preservedParams.set('from', from)
  if (to) preservedParams.set('to', to)
  if (dateRange) preservedParams.set('dateRange', dateRange)
  const search = preservedParams.size > 0 ? `?${preservedParams}` : ''

  const selectedIndex = tabs.findIndex((tab) =>
    location.pathname.endsWith(tab.to),
  )

  return (
    <div className="border-base-content/20 relative flex flex-shrink-0 flex-row justify-start gap-3 border-b">
      <SlidingIndicator
        className="!top-auto !bottom-0 !h-[2px]"
        itemRefs={itemRefs}
        radiusOn="bottom"
        selectedIndex={selectedIndex}
      />
      {tabs.map((tab, index) => (
        <div
          className="relative z-10"
          key={tab.to}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
        >
          <NavLink
            className={({ isActive }) =>
              cn(
                'btn btn-ghost relative z-20 rounded-none hover:bg-transparent hover:shadow-[inset_0_-2px_0_0_currentColor]',
                isActive ? 'text-base-content' : 'text-base-content/60',
              )
            }
            data-testid={`stats-tab-${tab.id}`}
            to={`${tab.to}${search}`}
          >
            {tab.label}
          </NavLink>
        </div>
      ))}
    </div>
  )
}
