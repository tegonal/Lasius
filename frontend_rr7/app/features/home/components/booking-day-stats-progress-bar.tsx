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

import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import { ProgressBar } from '~/components/ui/data-display/progress-bar'
import { decimalHoursToDurationString } from '~/lib/utils/duration'

export const BookingDayStatsProgressBar = () => {
  const { t } = useTranslation('common')
  const loaderData = useRouteLoaderData('routes/user.layout._index')

  const daySummary = loaderData?.daySummary
  if (!daySummary) return null

  const label = `${daySummary.fulfilledPercentage}% (${decimalHoursToDurationString(daySummary.hours)} ${t(
    'of',
    { defaultValue: 'of' },
  )} ${decimalHoursToDurationString(daySummary.plannedWorkingHours)})`

  return (
    <div className="w-full">
      <ProgressBar label={label} percentage={daySummary.fulfilledPercentage} />
    </div>
  )
}
