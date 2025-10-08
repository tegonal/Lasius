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

import { WorkingHoursDaySummary } from 'components/features/user/workingHours/week/workingHoursDaySummary'
import { Heading } from 'components/primitives/typography/Heading'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { ModelsWorkingHours } from 'lib/api/lasius'
import { dateFormat } from 'lib/utils/date/dateFormat'
import {
  decimalHoursToDate,
  decimalHoursToDurationStringRounded,
  getWeekOfDate,
  getWorkingHoursWeekdayString,
} from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { ModelsWorkingHoursWeekdays } from 'types/common'

type Props = {
  aggregatedPlannedWorkingHours: ModelsWorkingHours
}

export const WorkingHoursSummary: React.FC<Props> = ({ aggregatedPlannedWorkingHours }) => {
  const [week, setWeek] = useState<
    {
      day: ModelsWorkingHoursWeekdays
      date: IsoDateString
      value: IsoDateString
      displayValue: string
    }[]
  >([])
  const [totalWeek, setTotalWeek] = useState('')
  const { t } = useTranslation('common')

  useEffect(() => {
    if (aggregatedPlannedWorkingHours) {
      let weeklyTotal = 0
      const initialPlannedWorkingHours = aggregatedPlannedWorkingHours
      const initialWeek = getWeekOfDate(new Date()).map((date) => {
        const day = getWorkingHoursWeekdayString(date)
        const hours = initialPlannedWorkingHours[day]
        weeklyTotal += hours
        return {
          day,
          date,
          value: decimalHoursToDate(hours),
          displayValue: dateFormat(decimalHoursToDate(hours), 'HH:mm'),
        }
      })
      setWeek(initialWeek)
      setTotalWeek(decimalHoursToDurationStringRounded(weeklyTotal))
    }
  }, [aggregatedPlannedWorkingHours])

  return (
    <div className="w-full">
      <div className="border-base-content/20 mb-2 flex items-baseline justify-between border-b pb-2">
        <Heading as="h3" variant="h3">
          {t('workingHours.summary', { defaultValue: 'Summary' })}
        </Heading>
        <span className="text-sm font-normal">{totalWeek}</span>
      </div>
      <div className="bg-base-300 grid h-full w-full grid-cols-7 rounded-t-lg pb-1">
        {week?.length > 0 &&
          week?.map((item) => <WorkingHoursDaySummary key={item.date} item={item} />)}
      </div>
    </div>
  )
}
