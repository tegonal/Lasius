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

import { toDate } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import {
	useCalendarActions,
	useSelectedDate,
} from '~/features/calendar/calendar-store'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

/**
 * Manages day selection with calendar store + URL search param integration.
 * When useStore is true, selecting a day also sets ?date= in the URL,
 * which triggers loader revalidation in child routes.
 */
export const useCalendarSelection = (
	initialDate: IsoDateString,
	useStore = true,
) => {
	const storeSelectedDate = useSelectedDate()
	const { setSelectedDate: setStoreSelectedDate } = useCalendarActions()
	const [, setSearchParams] = useSearchParams()

	const [selectedDay, setSelectedDay] = useState<IsoDateString>(
		useStore ? storeSelectedDate : initialDate,
	)

	useEffect(() => {
		if (useStore) {
			setSelectedDay(storeSelectedDate)
		}
	}, [storeSelectedDate, useStore])

	const selectDay = useCallback(
		(day: IsoDateString) => {
			setSelectedDay(day)
			if (useStore) {
				setStoreSelectedDate(day)
				setSearchParams(
					(prev) => {
						prev.set('date', day)
						return prev
					},
					{ preventScrollReset: true },
				)
			}
		},
		[useStore, setStoreSelectedDate, setSearchParams],
	)

	const selectToday = useCallback(() => {
		selectDay(formatISOLocale(new Date()))
	}, [selectDay])

	const getDay = (str: IsoDateString) => {
		return toDate(new Date(str)).getDate()
	}

	const isDaySelected = (day: IsoDateString) => {
		return getDay(selectedDay) === getDay(day)
	}

	return {
		getDay,
		isDaySelected,
		selectDay,
		selectedDay,
		selectToday,
	}
}
