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

import { addMonths, addWeeks } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { formatISOLocale, getMonthOfDate, getWeekOfDate } from 'lib/utils/date/dates'
import { useCallback, useEffect, useState } from 'react'
import { useCalendarActions } from 'stores/calendarStore'

type ViewType = 'month' | 'week'

export const useCalendarNavigation = (initialDate: IsoDateString, viewType: ViewType) => {
  const { setSelectedDate } = useCalendarActions()
  const [period, setPeriod] = useState<IsoDateString[]>(
    viewType === 'month' ? getMonthOfDate(initialDate) : getWeekOfDate(initialDate),
  )

  // Update period when initialDate changes (e.g., when "Today" is clicked)
  useEffect(() => {
    const newPeriod =
      viewType === 'month' ? getMonthOfDate(initialDate) : getWeekOfDate(initialDate)
    setPeriod(newPeriod)
  }, [initialDate, viewType])

  const next = useCallback(() => {
    setPeriod((currentPeriod) => {
      const currentFirst = new Date(currentPeriod[0])
      const nextPeriod =
        viewType === 'month' ? addMonths(currentFirst, 1) : addWeeks(currentFirst, 1)
      const nextPeriodFormatted = formatISOLocale(nextPeriod)
      // Update selected date in store so stats update
      setSelectedDate(nextPeriodFormatted)
      return viewType === 'month' ? getMonthOfDate(nextPeriod) : getWeekOfDate(nextPeriodFormatted)
    })
  }, [viewType, setSelectedDate])

  const previous = useCallback(() => {
    setPeriod((currentPeriod) => {
      const currentFirst = new Date(currentPeriod[0])
      const prevPeriod =
        viewType === 'month' ? addMonths(currentFirst, -1) : addWeeks(currentFirst, -1)
      const prevPeriodFormatted = formatISOLocale(prevPeriod)
      // Update selected date in store so stats update
      setSelectedDate(prevPeriodFormatted)
      return viewType === 'month' ? getMonthOfDate(prevPeriod) : getWeekOfDate(prevPeriodFormatted)
    })
  }, [viewType, setSelectedDate])

  const goToDate = useCallback(
    (date: IsoDateString) => {
      setPeriod(viewType === 'month' ? getMonthOfDate(date) : getWeekOfDate(date))
    },
    [viewType],
  )

  return {
    period,
    next,
    previous,
    goToDate,
  }
}
