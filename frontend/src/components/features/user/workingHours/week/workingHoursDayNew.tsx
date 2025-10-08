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

import { TimeDropdown } from 'components/primitives/inputs/TimeDropdown'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { round } from 'es-toolkit'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import { updateWorkingHoursByOrganisation } from 'lib/api/lasius/user-organisations/user-organisations'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { cn } from 'lib/utils/cn'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import { useSWRConfig } from 'swr'
import { ModelsWorkingHoursWeekdays } from 'types/common'

type Props = {
  organisation: ModelsUserOrganisation | undefined
  item: {
    day: ModelsWorkingHoursWeekdays
    date: IsoDateString
    value: IsoDateString
    displayValue: string
  }
  decimalHours: number
}

export const WorkingHoursDayNew: React.FC<Props> = ({ item, organisation, decimalHours }) => {
  const { t } = useTranslation('common')
  const { mutate } = useSWRConfig()
  const { addToast } = useToast()
  const [isHovered, setIsHovered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isWeekend = item.day === 'saturday' || item.day === 'sunday'

  const handleChange = async (hours: number) => {
    if (isSaving || !organisation) return

    setIsSaving(true)
    try {
      await updateWorkingHoursByOrganisation(organisation.organisationReference.id, {
        ...organisation,
        plannedWorkingHours: {
          ...organisation.plannedWorkingHours,
          [item.day]: round(hours, 2),
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
      setIsSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center justify-center p-2 transition-all',
        isWeekend && 'bg-base-300/30',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className="text-base-content/70 mb-1 text-xs font-medium">
        <FormatDate date={item.date} format="dayNameShort" />
      </div>

      <div className="relative">
        <TimeDropdown
          value={decimalHours}
          onChange={handleChange}
          disabled={isSaving}
          isWeekend={isWeekend}
        />

        {isHovered && !isSaving && (
          <Pencil className="text-base-content/50 absolute top-1/2 -right-5 h-3 w-3 -translate-y-1/2" />
        )}
      </div>

      {isSaving && (
        <div className="bg-base-100/50 absolute inset-0 flex items-center justify-center">
          <span className="loading loading-spinner loading-xs"></span>
        </div>
      )}
    </div>
  )
}
