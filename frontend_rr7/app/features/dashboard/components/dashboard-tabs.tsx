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
import { NavLink, useSearchParams } from 'react-router'

export const DashboardTabs = () => {
	const { t } = useTranslation('common')
	const [searchParams] = useSearchParams()
	const dateParam = searchParams.get('date')
	const search = dateParam ? `?date=${dateParam}` : ''

	const tabs = [
		{ label: t('common.time.day', { defaultValue: 'Day' }), to: 'day' },
		{ label: t('common.time.week', { defaultValue: 'Week' }), to: 'week' },
		{
			label: t('common.time.month', { defaultValue: 'Month' }),
			to: 'month',
		},
		{
			label: t('workHealth.sixMonths', { defaultValue: '6 Months' }),
			to: '6months',
		},
		{ label: t('common.time.year', { defaultValue: 'Year' }), to: 'year' },
	]

	return (
		<div className="tabs tabs-border" role="tablist">
			{tabs.map((tab) => (
				<NavLink
					className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
					key={tab.to}
					to={`${tab.to}${search}`}
				>
					{tab.label}
				</NavLink>
			))}
		</div>
	)
}
