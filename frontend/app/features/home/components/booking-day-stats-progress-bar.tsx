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

import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import { ProgressBar } from '~/components/ui/data-display/progress-bar'
import { getDayProgress } from '~/features/home/lib/day-progress'
import { decimalHoursToDurationString } from '~/lib/utils/duration'
import { type loader } from '~/routes/user.layout._index'

const TICK_INTERVAL_MS = 25_000
const MS_PER_MINUTE = 60_000

const subscribeToTicks = (onTick: () => void) => {
  const interval = setInterval(onTick, TICK_INTERVAL_MS)
  return () => clearInterval(interval)
}

// The snapshot changes once per minute, so a render between two ticks reads the same value.
const getCurrentMinute = () => Math.floor(Date.now() / MS_PER_MINUTE)

// The server clock differs from the browser clock, so the server render shows no running time.
const getServerMinute = () => null

export const BookingDayStatsProgressBar = () => {
  const { t } = useTranslation('common')
  const loaderData = useRouteLoaderData<typeof loader>('routes/user.layout._index')
  const currentMinute = useSyncExternalStore(subscribeToTicks, getCurrentMinute, getServerMinute)

  const daySummary = loaderData?.daySummary
  if (!daySummary) return null

  const { currentBooking, selectedDate, selectedOrgId } = loaderData
  const running = currentBooking?.booking
  const progress = getDayProgress({
    bookedHours: daySummary.hours,
    now: currentMinute === null ? new Date(0) : new Date(currentMinute * MS_PER_MINUTE),
    plannedWorkingHours: daySummary.plannedWorkingHours,
    runningStart:
      running?.organisationReference.id === selectedOrgId ? running.start.dateTime : undefined,
    selectedDate,
  })

  const label = `${progress.fulfilledPercentage}% (${decimalHoursToDurationString(progress.hours)} ${t(
    'of',
    { defaultValue: 'of' },
  )} ${decimalHoursToDurationString(daySummary.plannedWorkingHours)})`

  return (
    <div className="w-full">
      <ProgressBar key={selectedDate} label={label} percentage={progress.fulfilledPercentage} />
    </div>
  )
}
