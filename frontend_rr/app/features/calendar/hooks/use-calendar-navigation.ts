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

import { addMonths, addWeeks, format } from 'date-fns'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'

import { getMonthOfDate, getWeekOfDate, type IsoDateString } from '~/lib/utils/dates'

/** Simple yyyy-MM-dd format safe for URL search params (no +/: characters) */
const toDateParameter = (d: Date): string => format(d, 'yyyy-MM-dd')

type ViewType = 'month' | 'week'

export const useCalendarNavigation = (selectedDate: IsoDateString, viewType: ViewType) => {
  const [, setSearchParameters] = useSearchParams()
  const [period, setPeriod] = useState<IsoDateString[]>(
    viewType === 'month' ? getMonthOfDate(selectedDate) : getWeekOfDate(selectedDate),
  )

  // Update period when selectedDate changes (e.g., from URL search param)
  const [periodSource, setPeriodSource] = useState({ selectedDate, viewType })
  if (periodSource.selectedDate !== selectedDate || periodSource.viewType !== viewType) {
    setPeriodSource({ selectedDate, viewType })
    setPeriod(viewType === 'month' ? getMonthOfDate(selectedDate) : getWeekOfDate(selectedDate))
  }

  const navigateToDate = useCallback(
    (date: IsoDateString) => {
      setSearchParameters(
        (previous_) => {
          previous_.set('date', date)
          return previous_
        },
        { preventScrollReset: true },
      )
    },
    [setSearchParameters],
  )

  const next = useCallback(() => {
    setPeriod((currentPeriod) => {
      const firstDay = currentPeriod[0]
      if (!firstDay) return currentPeriod
      const currentFirst = new Date(firstDay)
      const nextPeriod =
        viewType === 'month' ? addMonths(currentFirst, 1) : addWeeks(currentFirst, 1)
      navigateToDate(toDateParameter(nextPeriod))
      return viewType === 'month' ? getMonthOfDate(nextPeriod) : getWeekOfDate(nextPeriod)
    })
  }, [viewType, navigateToDate])

  const previous = useCallback(() => {
    setPeriod((currentPeriod) => {
      const firstDay = currentPeriod[0]
      if (!firstDay) return currentPeriod
      const currentFirst = new Date(firstDay)
      const previousPeriod =
        viewType === 'month' ? addMonths(currentFirst, -1) : addWeeks(currentFirst, -1)
      navigateToDate(toDateParameter(previousPeriod))
      return viewType === 'month' ? getMonthOfDate(previousPeriod) : getWeekOfDate(previousPeriod)
    })
  }, [viewType, navigateToDate])

  const goToDate = useCallback(
    (date: IsoDateString) => {
      setPeriod(viewType === 'month' ? getMonthOfDate(date) : getWeekOfDate(date))
    },
    [viewType],
  )

  return {
    goToDate,
    next,
    period,
    previous,
  }
}
