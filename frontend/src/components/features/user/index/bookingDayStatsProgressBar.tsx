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

import { ProgressBar } from 'components/ui/data-display/ProgressBar'
import { useGetBookingProgressDay } from 'lib/api/hooks/useGetBookingProgressDay'
import { decimalHoursToDurationString } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { useSelectedDate } from 'stores/calendarStore'
import { useIsClient } from 'usehooks-ts'

export const BookingDayStatsProgressBar: React.FC = () => {
  const selectedDate = useSelectedDate()
  const day = useGetBookingProgressDay(selectedDate)
  const { t } = useTranslation('common')
  const [label, setLabel] = React.useState('')
  const isClient = useIsClient()

  useEffect(() => {
    if (day) {
      setLabel(
        `${day.fulfilledPercentage}% (${decimalHoursToDurationString(day.hours)} ${t(
          'of',
        )} ${decimalHoursToDurationString(day.plannedWorkingHours)})`,
      )
    }
  }, [day, t])

  if (!isClient) return null

  return (
    <div className="w-full">
      <ProgressBar percentage={day.fulfilledPercentage} label={label} />
    </div>
  )
}
