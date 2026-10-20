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

import { differenceInMilliseconds, endOfDay, isWithinInterval, max, startOfDay } from 'date-fns'

import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { toLocalDate } from '~/lib/utils/dates'

const MS_PER_HOUR = 1000 * 60 * 60

type PeriodProgressInput = {
  // The finished hours of the period, from the booking history.
  bookedHours: number
  // The first and the last calendar day of the period.
  firstDay: Date
  lastDay: Date
  now: Date
  plannedWorkingHours: number
  runningStart?: string
}

/**
 * Adds the running booking to the finished hours when the period contains now. A booking that
 * started before the period counts from the start of the period, as the midnight split stores it.
 */
export const getPeriodProgress = ({
  bookedHours,
  firstDay,
  lastDay,
  now,
  plannedWorkingHours,
  runningStart,
}: PeriodProgressInput) => {
  const start = startOfDay(firstDay)
  let runningHours = 0
  if (runningStart && isWithinInterval(now, { end: endOfDay(lastDay), start })) {
    const countedFrom = max([toLocalDate(runningStart), start])
    runningHours = Math.max(0, differenceInMilliseconds(now, countedFrom) / MS_PER_HOUR)
  }
  const hours = bookedHours + runningHours
  return { hours, ...getExpectedVsBookedPercentage(plannedWorkingHours, hours) }
}
