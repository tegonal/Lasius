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

import { WorkingHoursDay } from 'components/features/user/workingHours/week/workingHoursDay'
import { AvatarOrganisation } from 'components/ui/data-display/avatar/avatarOrganisation'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import { dateFormat } from 'lib/utils/date/dateFormat'
import {
  decimalHoursToDate,
  decimalHoursToDurationStringRounded,
  getWeekOfDate,
  getWorkingHoursWeekdayString,
} from 'lib/utils/date/dates'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { ModelsWorkingHoursWeekdays } from 'types/common'

type Props = {
  organisation: ModelsUserOrganisation
}

type Week = {
  day: ModelsWorkingHoursWeekdays
  date: IsoDateString
  value: IsoDateString
  displayValue: string
}

export const WorkingHoursWeek: React.FC<Props> = ({ organisation }) => {
  const { t } = useTranslation('common')
  let weeklyTotal = 0
  const initialPlannedWorkingHours = organisation.plannedWorkingHours
    ? organisation.plannedWorkingHours
    : { ...plannedWorkingHoursStub }
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
  const week: Week[] = initialWeek
  const totalWeek: string = decimalHoursToDurationStringRounded(weeklyTotal)

  return (
    <div className="w-full">
      <div className="border-base-content/20 mb-2 flex items-baseline justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <AvatarOrganisation name={organisation.organisationReference.key} size={24} />
          <span>
            {organisation.private
              ? t('organisations.myPersonalOrganisation', {
                  defaultValue: 'My personal organisation',
                })
              : organisation.organisationReference.key}
          </span>
        </div>
        <span className="text-sm font-normal">{totalWeek}</span>
      </div>
      <div className="bg-base-300 grid h-full w-full grid-cols-7 rounded-t-lg pb-1">
        {week.length > 0 &&
          week.map((item) => (
            <WorkingHoursDay key={item.date} item={item} organisation={organisation} />
          ))}
      </div>
    </div>
  )
}
