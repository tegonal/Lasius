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

import { WorkingHoursDayNew } from 'components/features/user/workingHours/week/workingHoursDayNew'
import { Card, CardBody } from 'components/ui/cards/Card'
import { AvatarOrganisation } from 'components/ui/data-display/avatar/avatarOrganisation'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import { cn } from 'lib/utils/cn'
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
  hours: number
}

export const WorkingHoursWeekNew: React.FC<Props> = ({ organisation }) => {
  const { t } = useTranslation('common')
  let weeklyTotal = 0
  const initialPlannedWorkingHours = organisation.plannedWorkingHours || plannedWorkingHoursStub

  const initialWeek = getWeekOfDate(new Date()).map((date) => {
    const day = getWorkingHoursWeekdayString(date)
    const hours = initialPlannedWorkingHours[day]
    weeklyTotal += hours
    return {
      day,
      date,
      value: decimalHoursToDate(hours),
      displayValue: dateFormat(decimalHoursToDate(hours), 'HH:mm'),
      hours,
    }
  })
  const week: Week[] = initialWeek
  const totalWeek: string = decimalHoursToDurationStringRounded(weeklyTotal)

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-0">
        {/* Header */}
        <div className="border-base-300 bg-base-200/50 flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <AvatarOrganisation name={organisation.organisationReference.key} size={32} />
            <div>
              <h3 className="font-medium">
                {organisation.private
                  ? t('organizations.myPersonalOrganisation', {
                      defaultValue: 'My personal organisation',
                    })
                  : organisation.organisationReference.key}
              </h3>
              <p className="text-base-content/60 text-xs">
                {t('workingHours.setHoursDescription', {
                  defaultValue: 'Set your working hours for each day',
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{totalWeek}</div>
            <div className="text-base-content/60 text-xs">
              {t('workingHours.perWeek', { defaultValue: 'per week' })}
            </div>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {week.map((item, index) => {
            const isWeekend = item.day === 'saturday' || item.day === 'sunday'
            return (
              <div
                key={item.date}
                className={cn(
                  'border-base-300 border-r last:border-r-0',
                  isWeekend && 'bg-base-200/20',
                  index === 0 && 'border-l-0',
                )}>
                <WorkingHoursDayNew
                  item={item}
                  organisation={organisation}
                  decimalHours={item.hours}
                />
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
