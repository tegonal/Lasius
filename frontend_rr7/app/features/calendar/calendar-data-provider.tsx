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

import { createContext, useContext, useEffect, useMemo } from 'react'
import { useFetcher } from 'react-router'

import {
	apiTimespanMonth,
	apiTimespanWeek,
	type IsoDateString,
} from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'

type CalendarDataContextValue = {
	bookings: ModelsBooking[] | undefined
	error: unknown
	isLoading: boolean
}

type CalendarPeriod = 'month' | 'week'

const CalendarDataContext = createContext<CalendarDataContextValue | undefined>(
	undefined,
)

/**
 * CalendarDataProvider - Fetches booking data for an entire calendar period (week/month)
 * instead of making individual API calls per day.
 *
 * This provider:
 * - Makes a single API call for the entire period (week or month) via useFetcher
 * - Provides the data to all calendar day components via context
 *
 * Performance: Reduces 7-31 API calls down to 1 per calendar period
 */
export const CalendarDataProvider = ({
	children,
	date,
	organisationId,
	period,
}: {
	children: React.ReactNode
	date: IsoDateString
	organisationId: string
	period: CalendarPeriod
}) => {
	const fetcher = useFetcher<{ bookings: ModelsBooking[] }>()

	const timespan = useMemo(
		() => (period === 'week' ? apiTimespanWeek(date) : apiTimespanMonth(date)),
		[date, period],
	)

	const { load } = fetcher

	useEffect(() => {
		if (organisationId && date) {
			void load(
				`/api/calendar-bookings?orgId=${organisationId}&from=${timespan.from}&to=${timespan.to}`,
			)
		}
	}, [organisationId, timespan.from, timespan.to, date, load])

	const value = useMemo<CalendarDataContextValue>(
		() => ({
			bookings: fetcher.data?.bookings,
			error:
				fetcher.data && !('bookings' in fetcher.data)
					? fetcher.data
					: undefined,
			isLoading: fetcher.state === 'loading',
		}),
		[fetcher.data, fetcher.state],
	)

	return (
		<CalendarDataContext.Provider value={value}>
			{children}
		</CalendarDataContext.Provider>
	)
}

/**
 * useCalendarData - Hook to access calendar booking data from context
 *
 * Must be used within a CalendarDataProvider
 */
export const useCalendarData = (): CalendarDataContextValue => {
	const context = useContext(CalendarDataContext)

	if (context === undefined) {
		throw new Error(
			'useCalendarData must be used within a CalendarDataProvider',
		)
	}

	return context
}
