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

import { useTranslation } from 'react-i18next'
import { href, useLocation, useSearchParams } from 'react-router'

import { UnderlineTabs } from '~/components/ui/navigation/underline-tabs'

export const DashboardTabs = () => {
  const { t } = useTranslation('common')
  const [searchParameters] = useSearchParams()
  const location = useLocation()
  const dateParameter = searchParameters.get('date')
  const search = dateParameter ? `?${new URLSearchParams({ date: dateParameter })}` : ''

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

  const selectedIndex = tabs.findIndex((tab) => location.pathname.endsWith(tab.to))

  return (
    <UnderlineTabs
      selectedIndex={selectedIndex}
      tabs={tabs.map((tab) => ({ href: `${tab.to}${search}`, id: tab.id, label: tab.label }))}
      testIdPrefix="dashboard-tab"
    />
  )
}
