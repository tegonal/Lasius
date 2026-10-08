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

import { format } from 'date-fns'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'

import {
  type CalendarViewType,
  getPeriod,
  shiftByPeriod,
} from '~/features/calendar/lib/calendar-period'
import { type IsoDateString } from '~/lib/utils/dates'

/** Simple yyyy-MM-dd format safe for URL search params (no +/: characters) */
const toDateParameter = (d: Date): string => format(d, 'yyyy-MM-dd')

export const useCalendarNavigation = (selectedDate: IsoDateString, viewType: CalendarViewType) => {
  const [, setSearchParameters] = useSearchParams()
  const [period, setPeriod] = useState<IsoDateString[]>(getPeriod(selectedDate, viewType))

  // Update period when selectedDate changes (e.g., from URL search param)
  const [periodSource, setPeriodSource] = useState({ selectedDate, viewType })
  if (periodSource.selectedDate !== selectedDate || periodSource.viewType !== viewType) {
    setPeriodSource({ selectedDate, viewType })
    setPeriod(getPeriod(selectedDate, viewType))
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

  const move = useCallback(
    (amount: number) => {
      setPeriod((currentPeriod) => {
        const firstDay = currentPeriod[0]
        if (!firstDay) return currentPeriod
        const target = shiftByPeriod(new Date(firstDay), viewType, amount)
        navigateToDate(toDateParameter(target))
        return getPeriod(target, viewType)
      })
    },
    [viewType, navigateToDate],
  )

  const next = useCallback(() => move(1), [move])
  const previous = useCallback(() => move(-1), [move])

  const goToDate = useCallback(
    (date: IsoDateString) => {
      setPeriod(getPeriod(date, viewType))
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
