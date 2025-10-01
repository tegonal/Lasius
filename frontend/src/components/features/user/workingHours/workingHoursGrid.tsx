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
import { AvatarOrganisation } from 'components/ui/data-display/avatar/avatarOrganisation'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { TimeDropdownWithModal } from 'components/ui/overlays/TimeDropdownModal'
import { round } from 'es-toolkit'
import { useGetWeeklyPlannedWorkingHoursAggregate } from 'lib/api/hooks/useGetWeeklyPlannedWorkingHoursAggregate'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import { updateWorkingHoursByOrganisation } from 'lib/api/lasius/user-organisations/user-organisations'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { cn } from 'lib/utils/cn'
import {
  decimalHoursToDurationStringRounded,
  getWeekOfDate,
  getWorkingHoursWeekdayString,
} from 'lib/utils/date/dates'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import { useSWRConfig } from 'swr'
import { ModelsWorkingHoursWeekdays } from 'types/common'
import { useIsClient } from 'usehooks-ts'

export const WorkingHoursGrid: React.FC = () => {
  const { t } = useTranslation('common')
  const { organisations } = useOrganisation()
  const { allOrganisationsWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()
  const isClient = useIsClient()
  const { mutate } = useSWRConfig()
  const { addToast } = useToast()
  const [savingKey, setSavingKey] = useState<string | null>(null)

  if (!isClient) return null

  const week = getWeekOfDate(new Date())
  const weekDays: { key: ModelsWorkingHoursWeekdays; label: string; date: string }[] = week.map(
    (date) => ({
      key: getWorkingHoursWeekdayString(date),
      label: date,
      date,
    }),
  )

  const handleChange = async (
    organisation: ModelsUserOrganisation,
    day: ModelsWorkingHoursWeekdays,
    hours: number,
  ) => {
    const key = `${organisation.organisationReference.id}-${day}`
    setSavingKey(key)

    try {
      await updateWorkingHoursByOrganisation(organisation.organisationReference.id, {
        ...organisation,
        plannedWorkingHours: {
          ...(organisation.plannedWorkingHours || plannedWorkingHoursStub),
          [day]: round(hours, 2),
        },
      })
      await mutate(getGetUserProfileKey())
      addToast({
        message: t('workingHours.status.updated', { defaultValue: 'Working hours updated' }),
        type: 'SUCCESS',
      })
    } catch {
      addToast({
        message: t('workingHours.errors.updateFailed', {
          defaultValue: 'Failed to update working hours',
        }),
        type: 'ERROR',
      })
    } finally {
      setSavingKey(null)
    }
  }

  // Calculate totals
  const calculateOrgTotal = (org: ModelsUserOrganisation): number => {
    const hours = org.plannedWorkingHours || plannedWorkingHoursStub
    return Object.values(hours).reduce((sum, h) => sum + h, 0)
  }

  const calculateDayTotal = (day: ModelsWorkingHoursWeekdays): number => {
    return (
      organisations?.reduce((sum, org) => {
        const hours = org.plannedWorkingHours || plannedWorkingHoursStub
        return sum + hours[day]
      }, 0) || 0
    )
  }

  const grandTotal = Object.values(allOrganisationsWorkingHours).reduce((sum, h) => sum + h, 0)

  return (
    <Card>
      <CardBody className="p-0">
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="bg-base-100 border-base-300 sticky left-0 z-10 border-r border-b p-3 text-left">
                  <span className="text-base-content/70 text-sm font-medium">
                    {t('organisations.organization', { defaultValue: 'Organisation' })}
                  </span>
                </th>

                {weekDays.map((day) => {
                  const isWeekend = day.key === 'saturday' || day.key === 'sunday'
                  return (
                    <th
                      key={day.key}
                      className={cn(
                        'border-base-300 border-r border-b p-2 text-center',
                        isWeekend && 'bg-base-200/30',
                      )}>
                      <div className="text-sm font-medium">
                        <FormatDate date={day.date} format="dayNameShort" />
                      </div>
                    </th>
                  )
                })}

                <th className="border-base-300 bg-primary/5 border-b p-2 text-center">
                  <div className="text-primary text-sm font-semibold">
                    {t('common.total', { defaultValue: 'Total' })}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {organisations?.map((org) => (
                <tr key={org.organisationReference.id} className="group hover:bg-base-200/20">
                  <td className="bg-base-100 border-base-300 sticky left-0 z-10 border-r p-3">
                    <div className="flex items-center gap-2">
                      <AvatarOrganisation name={org.organisationReference.key} size={24} />
                      <span
                        className="max-w-[15ch] truncate text-sm font-medium"
                        title={org.organisationReference.key}>
                        {org.private
                          ? t('organisations.myPersonalOrganisation', {
                              defaultValue: 'My personal organisation',
                            })
                          : org.organisationReference.key}
                      </span>
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const hours = (org.plannedWorkingHours || plannedWorkingHoursStub)[day.key]
                    const isWeekend = day.key === 'saturday' || day.key === 'sunday'
                    const key = `${org.organisationReference.id}-${day.key}`
                    const isSaving = savingKey === key

                    return (
                      <td
                        key={day.key}
                        className={cn(
                          'border-base-300 relative border-r p-1 text-center transition-colors',
                          isWeekend && 'bg-base-200/20',
                          'hover:bg-base-200/40',
                        )}>
                        <TimeDropdownWithModal
                          value={hours}
                          onChange={(h) => handleChange(org, day.key, h)}
                          disabled={isSaving}
                          isWeekend={isWeekend}
                          dayName={day.label}
                          orgId={org.organisationReference.id}
                        />
                        {isSaving && (
                          <div className="bg-base-100/50 absolute inset-0 flex items-center justify-center">
                            <span className="loading loading-spinner loading-xs"></span>
                          </div>
                        )}
                      </td>
                    )
                  })}

                  <td className="bg-primary/5 p-2 text-center">
                    <span className="text-primary font-semibold">
                      {decimalHoursToDurationStringRounded(calculateOrgTotal(org))}
                    </span>
                  </td>
                </tr>
              ))}

              <tr className="bg-base-200/50 font-medium">
                <td className="bg-base-200/50 border-base-300 sticky left-0 z-10 border-t border-r p-3">
                  <span className="text-sm font-semibold">
                    {t('workingHours.dailyTotal', { defaultValue: 'Daily Total' })}
                  </span>
                </td>
                {weekDays.map((day) => {
                  const isWeekend = day.key === 'saturday' || day.key === 'sunday'
                  const dayTotal = calculateDayTotal(day.key)
                  return (
                    <td
                      key={day.key}
                      className={cn(
                        'border-base-300 border-t border-r p-2 text-center',
                        isWeekend && 'bg-base-200/30',
                      )}>
                      <span className="text-sm font-semibold">
                        {dayTotal > 0 ? decimalHoursToDurationStringRounded(dayTotal) : '—'}
                      </span>
                    </td>
                  )
                })}
                <td className="border-base-300 bg-primary/10 border-t p-2 text-center">
                  <span className="text-primary text-lg font-bold">
                    {decimalHoursToDurationStringRounded(grandTotal)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
