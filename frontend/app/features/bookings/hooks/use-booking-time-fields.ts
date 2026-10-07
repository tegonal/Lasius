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

import { type FieldMetadata, useInputControl } from '@conform-to/react'
import { ArrowDownToLine, ArrowUpToLine, type LucideIcon as LucideIconType } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  type BookingFormMode,
  computeAutoAdjustedEnd,
  computeDurationHours,
  getPresetEndReference,
  getPresetStartReference,
  type PresetReference,
} from '~/features/bookings/lib/booking-form-logic'
import { orEmpty } from '~/lib/utils/strings'
import { type ModelsBooking } from '~/services/api/lasius'

type UseBookingTimeFieldsOptions = {
  bookingAfter?: ModelsBooking
  bookingBefore?: ModelsBooking
  endField: FieldMetadata<string>
  initialEnd: string
  latestBooking?: ModelsBooking
  mode: BookingFormMode
  startField: FieldMetadata<string>
}

const LONG_DURATION_HOURS = 8

const toPresetProperties = (
  reference: null | PresetReference,
  icon: LucideIconType,
  labels: Record<PresetReference['kind'], string>,
) =>
  reference
    ? { presetDate: reference.date, presetIcon: icon, presetLabel: labels[reference.kind] }
    : {}

/** Owns the start and end controls, the end auto-adjustment, the duration and the time presets. */
export const useBookingTimeFields = ({
  bookingAfter,
  bookingBefore,
  endField,
  initialEnd,
  latestBooking,
  mode,
  startField,
}: UseBookingTimeFieldsOptions) => {
  const { t } = useTranslation('common')
  const startControl = useInputControl(startField)
  const endControl = useInputControl(endField)
  const start = orEmpty(startControl.value)
  const end = orEmpty(endControl.value)

  // The end that the form set itself. An end that differs from it was changed by the user.
  const trackedEnd = useRef('')
  useEffect(() => {
    trackedEnd.current = initialEnd
  }, [initialEnd])

  const previousStart = useRef(startControl.value)
  useEffect(() => {
    const adjustedEnd = computeAutoAdjustedEnd({
      end,
      previousStart: previousStart.current,
      start,
      trackedEnd: trackedEnd.current,
    })
    if (adjustedEnd) {
      endControl.change(adjustedEnd)
      trackedEnd.current = adjustedEnd
    }
    previousStart.current = start
  }, [start, end, endControl])

  const presetLabels: Record<PresetReference['kind'], string> = {
    latest: t(
      'bookings:hints.useEndTimeOfLatest',
      'Use end time of latest booking as start time for this one',
    ),
    next: t(
      'bookings:hints.useStartTimeOfNext',
      'Use start time of next booking as end time for this one',
    ),
    previous: t(
      'bookings:hints.useEndTimeOfPrevious',
      'Use end time of previous booking as start time for this one',
    ),
  }

  // The form spreads these objects into props, so a new object per render changes no prop value.
  const presetStart = toPresetProperties(
    getPresetStartReference({ bookingBefore, latestBooking, mode, start }),
    ArrowDownToLine,
    presetLabels,
  )
  const presetEnd = toPresetProperties(
    getPresetEndReference({ bookingAfter, end, mode }),
    ArrowUpToLine,
    presetLabels,
  )

  const handleEndChange = useCallback(
    (isoString: string) => endControl.change(isoString),
    [endControl],
  )

  return {
    changeEnd: (value: string) => endControl.change(value),
    changeStart: (value: string) => startControl.change(value),
    end,
    handleEndChange,
    isShowDurationWarning: computeDurationHours(start, end) > LONG_DURATION_HOURS,
    presetEnd,
    presetStart,
    start,
  }
}
