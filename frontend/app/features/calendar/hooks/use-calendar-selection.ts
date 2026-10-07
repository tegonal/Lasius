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
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

import { formatISOLocale, type IsoDateString, toCalendarDay } from '~/lib/utils/dates'

/** Simple yyyy-MM-dd format safe for URL search params (no +/: characters) */
const toDateParameter = (d: Date): string => format(d, 'yyyy-MM-dd')

/**
 * Manages day selection via URL search params.
 * The ?date= param is the source of truth; localStorage persistence
 * is handled by usePersistedSearchParam in the parent component.
 */
export const useCalendarSelection = (selectedDate: IsoDateString) => {
  const [, setSearchParameters] = useSearchParams()

  const selectDay = useCallback(
    (day: IsoDateString) => {
      setSearchParameters(
        (previous) => {
          previous.set('date', toDateParameter(toCalendarDay(day)))
          return previous
        },
        { preventScrollReset: true },
      )
    },
    [setSearchParameters],
  )

  const selectToday = useCallback(() => {
    selectDay(formatISOLocale(new Date()))
  }, [selectDay])

  const getDay = (string_: IsoDateString) => {
    return toCalendarDay(string_).getDate()
  }

  const isDaySelected = (day: IsoDateString) => {
    return getDay(selectedDate) === getDay(day)
  }

  return {
    getDay,
    isDaySelected,
    selectDay,
    selectedDay: selectedDate,
    selectToday,
  }
}
