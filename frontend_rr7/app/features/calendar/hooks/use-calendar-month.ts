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

import {
	eachDayOfInterval,
	endOfMonth,
	format,
	getDay,
	startOfMonth,
} from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getDateLocale } from '~/lib/utils/date-locale'

/**
 * Shared hook for computing calendar month layout data from a viewDate.
 *
 * Returns the days in the month, Monday-based start offset, and
 * single-letter weekday headers (locale-aware).
 */
export const useCalendarMonth = (viewDate: Date) => {
	const { i18n } = useTranslation('common')
	const locale = getDateLocale(i18n.language)
	const monthDays = useMemo(() => {
		const start = startOfMonth(viewDate)
		const end = endOfMonth(viewDate)
		return eachDayOfInterval({ end, start })
	}, [viewDate])

	// Monday-based offset: getDay returns 0=Sun, we want Mon=0
	const startOffset = useMemo(() => {
		const day = getDay(startOfMonth(viewDate))
		return day === 0 ? 6 : day - 1
	}, [viewDate])

	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(2025, 0, 6 + i) // Jan 6, 2025 is a Monday
			return format(d, 'EEEEE', { locale })
		})
	}, [locale])

	return { monthDays, startOffset, weekDays }
}
