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

import { formatISOLocale } from '~/lib/utils/dates'

import { DurationSegmentInput } from './shared/duration-segment-input'
import { addMinutesToDate, calculateDurationMinutes } from './shared/duration-utilities'

export type SegmentedDurationInputConnectedProperties = {
  endValue: string
  onEndChange: (isoString: string) => void
  startValue: string
}

/** Edits the end time of a booking through its duration from the start time. */
export const SegmentedDurationInputConnected = ({
  endValue,
  onEndChange,
  startValue,
}: SegmentedDurationInputConnectedProperties) => {
  const durationMinutes = calculateDurationMinutes(
    startValue ? new Date(startValue) : null,
    endValue ? new Date(endValue) : null,
  )

  const updateEndTime = (newDurationMinutes: number) => {
    if (!startValue) return
    const newEndDate = addMinutesToDate(new Date(startValue), newDurationMinutes)
    onEndChange(formatISOLocale(newEndDate))
  }

  return (
    <DurationSegmentInput
      durationMinutes={durationMinutes}
      isInvalid={durationMinutes < 0}
      onDurationChange={updateEndTime}
    />
  )
}
