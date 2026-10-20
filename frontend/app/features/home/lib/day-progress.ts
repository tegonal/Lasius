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

import { differenceInMilliseconds, isSameDay, max, startOfDay } from 'date-fns'

import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { toCalendarDay, toLocalDate } from '~/lib/utils/dates'

const MS_PER_HOUR = 1000 * 60 * 60

type DayProgressInput = {
  // The finished hours of the selected day, from the booking history.
  bookedHours: number
  now: Date
  plannedWorkingHours: number
  runningStart?: string
  selectedDate: string
}

/**
 * Adds the running booking to the finished hours when the selected day is today. A booking that
 * started before midnight counts from midnight, as the midnight split stores it.
 */
export const getDayProgress = ({
  bookedHours,
  now,
  plannedWorkingHours,
  runningStart,
  selectedDate,
}: DayProgressInput) => {
  const day = toCalendarDay(selectedDate)
  let runningHours = 0
  if (runningStart && isSameDay(day, now)) {
    const countedFrom = max([toLocalDate(runningStart), startOfDay(day)])
    runningHours = Math.max(0, differenceInMilliseconds(now, countedFrom) / MS_PER_HOUR)
  }
  const hours = bookedHours + runningHours
  return { hours, ...getExpectedVsBookedPercentage(plannedWorkingHours, hours) }
}
