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

import { SegmentedDurationInputConnected } from './segmented-duration-input-connected'
import { calculateDurationMinutes } from './shared/duration-utils'

export type InputDatePickerDurationProps = {
  endValue: string
  onEndChange: (isoString: string) => void
  startValue: string
}

export const InputDatePickerDuration = ({
  endValue,
  onEndChange,
  startValue,
}: InputDatePickerDurationProps) => {
  const { t } = useTranslation('common')

  const durationMinutes = calculateDurationMinutes(
    startValue ? new Date(startValue) : null,
    endValue ? new Date(endValue) : null,
  )

  const isInvalid = durationMinutes < 0

  return (
    <div className="flex w-full flex-col gap-2">
      <SegmentedDurationInputConnected
        endValue={endValue}
        onEndChange={onEndChange}
        startValue={startValue}
      />
      {isInvalid && (
        <span className="text-error mt-1 text-xs">
          {t('validation.endBeforeStart', 'End time is before start time')}
        </span>
      )}
    </div>
  )
}
