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

import React, { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { SegmentedDurationInputConnected } from './SegmentedDurationInputConnected'

export type InputDurationStandaloneProps = {
  name: string
  onDecimalHoursChange?: (hours: number) => void
}

export const InputDurationStandalone: React.FC<InputDurationStandaloneProps> = ({
  name: _name,
  onDecimalHoursChange,
}) => {
  const hookForm = useForm({
    defaultValues: {
      startDate: new Date('2000-01-01T00:00:00').toISOString(),
      endDate: new Date('2000-01-01T00:00:00').toISOString(),
    },
  })

  // Watch for changes and notify parent
  const endDate = hookForm.watch('endDate')
  const startDate = hookForm.watch('startDate')

  useEffect(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    const decimalHours = durationMinutes / 60
    onDecimalHoursChange?.(decimalHours)
  }, [startDate, endDate, onDecimalHoursChange])

  return (
    <FormProvider {...hookForm}>
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="-my-5">
            <SegmentedDurationInputConnected startFieldName="startDate" endFieldName="endDate" />
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
