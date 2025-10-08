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

import { useRequiredFormContext } from 'components/ui/forms/WithFormContext'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useFormContext } from 'react-hook-form'

import { SegmentedDurationInputConnected } from './SegmentedDurationInputConnected'
import { calculateDurationMinutes } from './shared/durationUtils'

export type InputDatePickerDurationProps = {
  startFieldName: string
  endFieldName: string
}

// Internal component that assumes form context is available
const InputDatePickerDurationInternal: React.FC<InputDatePickerDurationProps> = ({
  startFieldName,
  endFieldName,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useRequiredFormContext()

  const startValue = parentFormContext.watch(startFieldName)
  const endValue = parentFormContext.watch(endFieldName)

  // Calculate duration for validation display
  const durationMinutes = calculateDurationMinutes(
    startValue ? new Date(startValue) : null,
    endValue ? new Date(endValue) : null,
  )

  const isInvalid = durationMinutes < 0

  return (
    <div className="flex w-full flex-col gap-2">
      <SegmentedDurationInputConnected
        startFieldName={startFieldName}
        endFieldName={endFieldName}
      />
      {isInvalid && (
        <span className="text-error mt-1 text-xs">
          {t('common.validation.endBeforeStart', { defaultValue: 'End time is before start time' })}
        </span>
      )}
    </div>
  )
}

// Export the wrapped version that handles missing context gracefully
export const InputDatePickerDuration: React.FC<InputDatePickerDurationProps> = (props) => {
  const formContext = useFormContext()

  if (!formContext) {
    console.warn('InputDatePickerDuration: No form context available')
    return null
  }

  return <InputDatePickerDurationInternal {...props} />
}
