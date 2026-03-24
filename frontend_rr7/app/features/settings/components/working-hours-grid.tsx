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

import { round } from 'es-toolkit'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Card, CardBody } from '~/components/ui/cards/card'
import { AvatarOrganisation } from '~/components/ui/data-display/avatar/avatar-organisation'
import { FormatDate } from '~/components/ui/data-display/format-date'
import { useToast } from '~/components/ui/feedback/use-toast'
import { TimeDropdownWithModal } from '~/components/ui/overlays/time-dropdown-with-modal'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useIsClient } from '~/lib/hooks/use-is-client'
import { cn } from '~/lib/utils/cn'
import { plannedWorkingHoursStub } from '~/lib/utils/date/stub-planned-working-hours'
import { getWeekOfDate, getWorkingHoursWeekdayString } from '~/lib/utils/dates'
import { decimalHoursToDurationStringRounded } from '~/lib/utils/duration'
import { useUpdateWorkingHoursByOrganisation } from '~/services/api/lasius-hooks/user-organisations/user-organisations'
import { type ModelsUserOrganisation } from '~/services/api/lasius/modelsUserOrganisation'
import { type ModelsWorkingHoursWeekdays } from '~/types/common'

export const WorkingHoursGrid = () => {
  const { t } = useTranslation('working-hours')
  const { organisations } = useOrganisation()
  const isClient = useIsClient()
  const { addToast } = useToast()
  const [savingKey, setSavingKey] = useState<null | string>(null)
  const revalidator = useRevalidator()
  const updateWorkingHours = useUpdateWorkingHoursByOrganisation({
    onError: () => {
      setSavingKey(null)
      void revalidator.revalidate()
      addToast({
        message: t('errors.updateFailed', 'Failed to update working hours'),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      setSavingKey(null)
      void revalidator.revalidate()
      addToast({
        message: t('status.updated', 'Working hours updated'),
        type: 'SUCCESS',
      })
    },
  })

  if (!isClient) return null

  const week = getWeekOfDate(new Date())
  const weekDays: {
    date: string
    key: ModelsWorkingHoursWeekdays
    label: string
  }[] = week.map((date) => ({
    date,
    key: getWorkingHoursWeekdayString(date),
    label: date,
  }))

  const handleChange = (
    organisation: ModelsUserOrganisation,
    day: ModelsWorkingHoursWeekdays,
    hours: number,
  ) => {
    const key = `${organisation.organisationReference.id}-${day}`
    setSavingKey(key)

    const updatedHours = {
      ...(organisation.plannedWorkingHours ?? plannedWorkingHoursStub),
      [day]: round(hours, 2),
    }

    updateWorkingHours.submit({
      body: { plannedWorkingHours: updatedHours },
      orgId: organisation.organisationReference.id,
    })
  }

  const calculateDayTotal = (day: ModelsWorkingHoursWeekdays): number => {
    return (
      organisations?.reduce((sum, org) => {
        const hours = org.plannedWorkingHours ?? plannedWorkingHoursStub
        return sum + hours[day]
      }, 0) ?? 0
    )
  }

  return (
    <Card>
      <CardBody className="p-0">
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="bg-base-100 border-base-300 sticky left-0 z-10 border-r border-b p-3 text-left">
                  <span className="text-base-content/70 text-sm font-medium">
                    {t('organisation:organization', 'Organisation')}
                  </span>
                </th>

                {weekDays.map((day) => {
                  const isWeekend =
                    day.key === 'saturday' || day.key === 'sunday'
                  return (
                    <th
                      className={cn(
                        'border-base-300 border-b p-2 text-left',
                        isWeekend && 'bg-base-200/30',
                        day.key !== 'sunday' && 'border-r',
                      )}
                      key={day.key}
                    >
                      <div className="text-sm font-medium">
                        <FormatDate date={day.date} format="dayNameShort" />
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {organisations?.map((org) => (
                <tr
                  className="group hover:bg-base-200/20"
                  key={org.organisationReference.id}
                >
                  <td className="bg-base-100 border-base-300 sticky left-0 z-10 border-r p-3">
                    <div className="flex items-center gap-2">
                      <AvatarOrganisation
                        name={org.organisationReference.key}
                        size={24}
                      />
                      <span
                        className="max-w-[15ch] truncate text-sm font-medium"
                        title={org.organisationReference.key}
                      >
                        {org.private
                          ? t(
                              'organisation:myPersonalOrganisation',
                              'My personal organisation',
                            )
                          : org.organisationReference.key}
                      </span>
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const hours = (org.plannedWorkingHours ??
                      plannedWorkingHoursStub)[day.key]
                    const isWeekend =
                      day.key === 'saturday' || day.key === 'sunday'
                    const cellKey = `${org.organisationReference.id}-${day.key}`
                    const isSaving = savingKey === cellKey

                    return (
                      <td
                        className={cn(
                          'border-base-300 relative p-1 text-left transition-colors',
                          isWeekend && 'bg-base-200/20',
                          'hover:bg-base-200/40',
                          day.key !== 'sunday' && 'border-r',
                        )}
                        key={day.key}
                      >
                        <TimeDropdownWithModal
                          dayName={day.label}
                          disabled={isSaving}
                          isWeekend={isWeekend}
                          onChange={(h) => handleChange(org, day.key, h)}
                          orgId={org.organisationReference.id}
                          value={hours}
                        />
                        {isSaving && (
                          <div className="bg-base-100/50 absolute inset-0 flex items-center justify-center">
                            <span className="loading loading-spinner loading-xs" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              <tr className="bg-base-200/50 font-medium">
                <td className="bg-base-200/50 border-base-300 sticky left-0 z-10 border-t border-r p-3">
                  <span className="text-sm font-semibold">
                    {t('dailyTotal', 'Daily Total')}
                  </span>
                </td>
                {weekDays.map((day) => {
                  const isWeekend =
                    day.key === 'saturday' || day.key === 'sunday'
                  const dayTotal = calculateDayTotal(day.key)
                  return (
                    <td
                      className={cn(
                        'border-base-300 border-t text-left',
                        isWeekend && 'bg-base-200/30',
                        day.key !== 'sunday' && 'border-r',
                      )}
                      key={day.key}
                    >
                      <span className="inline-block px-3 py-1 text-sm font-semibold">
                        {dayTotal > 0
                          ? decimalHoursToDurationStringRounded(dayTotal)
                          : '\u2014'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
