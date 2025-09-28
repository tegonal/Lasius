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

import { Card, CardBody } from 'components/ui/cards/Card'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { ModelsWorkingHours } from 'lib/api/lasius'
import { cn } from 'lib/utils/cn'
import { decimalHoursToDurationStringRounded, getWeekOfDate } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  aggregatedPlannedWorkingHours: ModelsWorkingHours
  organizationHours?: { [orgId: string]: ModelsWorkingHours }
}

export const WorkingHoursSummaryNew: React.FC<Props> = ({
  aggregatedPlannedWorkingHours,
  organizationHours,
}) => {
  const { t } = useTranslation('common')
  const week = getWeekOfDate(new Date())

  const weekDays = [
    { key: 'monday', label: 'Mo' },
    { key: 'tuesday', label: 'Tu' },
    { key: 'wednesday', label: 'We' },
    { key: 'thursday', label: 'Th' },
    { key: 'friday', label: 'Fr' },
    { key: 'saturday', label: 'Sa' },
    { key: 'sunday', label: 'Su' },
  ]

  const totalHours = Object.values(aggregatedPlannedWorkingHours).reduce(
    (sum: number, h: number) => sum + h,
    0,
  )
  const totalFormatted = decimalHoursToDurationStringRounded(totalHours)

  // Find max hours for scaling
  const maxDayHours = Math.max(...Object.values(aggregatedPlannedWorkingHours))

  return (
    <Card className="from-primary/5 to-secondary/5 bg-gradient-to-br">
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {t('workingHours.weeklyHoursSummary', { defaultValue: 'Weekly Hours Summary' })}
            </h2>
            <p className="text-base-content/60 text-sm">
              {t('workingHours.totalHoursDescription', {
                defaultValue: 'Total hours across all organizations',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-primary text-3xl font-bold">{totalFormatted}</div>
            <div className="text-base-content/60 text-xs">
              {t('workingHours.totalPerWeek', { defaultValue: 'total per week' })}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {weekDays.map((day, index) => {
            const dayHours = aggregatedPlannedWorkingHours[day.key as keyof ModelsWorkingHours]
            const isWeekend = day.key === 'saturday' || day.key === 'sunday'
            const percentage = maxDayHours > 0 ? (dayHours / maxDayHours) * 100 : 0

            return (
              <div
                key={day.key}
                className={cn(
                  'group hover:bg-base-200/50 flex items-center gap-3 rounded-lg p-2 transition-colors',
                  isWeekend && 'opacity-70',
                )}>
                {/* Day label with date */}
                <div className="w-20 text-sm">
                  <div className="font-medium">{day.label}</div>
                  <div className="text-base-content/50 text-xs">
                    <FormatDate date={week[index]} format="day" />
                  </div>
                </div>

                {/* Visual bar */}
                <div className="relative flex-1">
                  <div className="bg-base-300/50 h-8 overflow-hidden rounded">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        dayHours > 0
                          ? 'from-primary to-primary/70 bg-gradient-to-r'
                          : 'bg-base-300',
                      )}
                      style={{ width: `${percentage}%` }}>
                      <div className="flex h-full items-center px-2">
                        {dayHours > 0 && (
                          <span className="text-primary-content text-xs font-medium">
                            {decimalHoursToDurationStringRounded(dayHours)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stacked organization breakdown (on hover) */}
                  {organizationHours && (
                    <div className="absolute inset-0 flex opacity-0 transition-opacity group-hover:opacity-100">
                      {Object.entries(organizationHours).map(([orgId, hours]) => {
                        const orgDayHours = hours[day.key as keyof ModelsWorkingHours]
                        const orgPercentage = dayHours > 0 ? (orgDayHours / dayHours) * 100 : 0
                        if (orgDayHours === 0) return null

                        return (
                          <div
                            key={orgId}
                            className="border-base-100 bg-secondary/50 h-full border-r-2 first:rounded-l last:rounded-r last:border-r-0"
                            style={{ width: `${orgPercentage}%` }}
                            title={`${orgId}: ${decimalHoursToDurationStringRounded(orgDayHours)}`}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Hours display */}
                <div className="w-16 text-right text-sm font-medium">
                  {dayHours > 0 ? decimalHoursToDurationStringRounded(dayHours) : '—'}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-base-200/50 text-base-content/60 mt-4 flex items-center justify-center rounded-lg p-2 text-xs">
          <span>
            {t('workingHours.clickToAdjustHours', {
              defaultValue: 'Click on any day in the organization cards below to adjust hours',
            })}
          </span>
        </div>
      </CardBody>
    </Card>
  )
}
