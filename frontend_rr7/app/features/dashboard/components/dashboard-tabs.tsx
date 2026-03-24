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
import { useTranslation } from 'react-i18next'
import { href, NavLink, useLocation, useSearchParams } from 'react-router'

import { SlidingIndicator } from '~/components/ui/animations/sliding-indicator'
import { cn } from '~/lib/utils/cn'

export const DashboardTabs = () => {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const dateParam = searchParams.get('date')
  const search = dateParam ? `?${new URLSearchParams({ date: dateParam })}` : ''
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  const tabs = [
    {
      id: 'day',
      label: t('time.day', 'Day'),
      to: href('/user/dashboard/day'),
    },
    {
      id: 'week',
      label: t('time.week', 'Week'),
      to: href('/user/dashboard/week'),
    },
    {
      id: 'month',
      label: t('time.month', 'Month'),
      to: href('/user/dashboard/month'),
    },
    {
      id: '6months',
      label: t('dashboard:workHealth.sixMonths', '6 Months'),
      to: href('/user/dashboard/6months'),
    },
    {
      id: 'year',
      label: t('time.year', 'Year'),
      to: href('/user/dashboard/year'),
    },
  ]

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
            data-testid={`dashboard-tab-${tab.id}`}
            to={`${tab.to}${search}`}
          >
            {tab.label}
          </NavLink>
        </div>
      ))}
    </div>
  )
}
