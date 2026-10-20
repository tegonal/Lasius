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
import { useTranslation } from 'react-i18next'

import { ProgressBar } from '~/components/ui/data-display/progress-bar'
import { useCalendarData } from '~/features/calendar/calendar-data-provider'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useCurrentMinute } from '~/hooks/use-current-minute'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { getDailyTotalsSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getPlannedHoursForRange } from '~/lib/api/functions/get-planned-working-hours'
import { type IsoDateString, toCalendarDay } from '~/lib/utils/dates'
import { decimalHoursToDurationString } from '~/lib/utils/duration'
import { getPeriodProgress } from '~/lib/utils/period-progress'

interface CalendarWeekProgressBarProperties {
  week: IsoDateString[]
}

/** The booked hours of the week against its planned hours, with a second line for overtime. */
export const CalendarWeekProgressBar = ({ week }: CalendarWeekProgressBarProperties) => {
  const { t } = useTranslation('common')
  const { dailyTotals } = useCalendarData()
  const { selectedOrganisation, selectedOrganisationId } = useOrganisation()
  const currentBooking = useLayoutLoaderData()?.currentBooking
  const now = useCurrentMinute()

  const firstIsoDay = week[0]
  const lastIsoDay = week.at(-1)
  if (!firstIsoDay || !lastIsoDay) return null

  const firstDay = toCalendarDay(firstIsoDay)
  const lastDay = toCalendarDay(lastIsoDay)
  const dayKeys = new Set(week.map((day) => format(toCalendarDay(day), 'yyyy-MM-dd')))
  const { hours: bookedHours } = getDailyTotalsSummary(
    (dailyTotals ?? []).filter((total) => dayKeys.has(total.date)),
  )
  const plannedHours = selectedOrganisation?.plannedWorkingHours
  const plannedWorkingHours = getPlannedHoursForRange(
    firstDay,
    lastDay,
    plannedHours ? { ...plannedHours } : null,
  )
  const running = currentBooking?.booking
  const progress = getPeriodProgress({
    bookedHours,
    firstDay,
    lastDay,
    now,
    plannedWorkingHours,
    runningStart:
      running?.organisationReference.id === selectedOrganisationId
        ? running.start.dateTime
        : undefined,
  })

  const label = `${progress.fulfilledPercentage}% (${decimalHoursToDurationString(progress.hours)} ${t(
    'of',
    { defaultValue: 'of' },
  )} ${decimalHoursToDurationString(plannedWorkingHours)})`

  return (
    <div className="w-full" data-testid="calendar-week-progress">
      <ProgressBar label={label} percentage={progress.fulfilledPercentage} size="sm" />
    </div>
  )
}
