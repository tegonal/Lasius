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

import { addSeconds } from 'date-fns'
import { ArrowDownToLine } from 'lucide-react'

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsCurrentUserTimeBooking } from '~/services/api/lasius'

type RunningBooking = ModelsCurrentUserTimeBooking['booking']

/** The form values of a running booking. Without a booking, every field is empty. */
export const getRunningBookingDefaults = (booking: RunningBooking) => ({
  projectId: booking?.projectReference.id ?? '',
  start: booking ? formatISOLocale(new Date(booking.start.dateTime)) : '',
  tags: booking?.tags ? JSON.stringify(booking.tags) : '',
})

/**
 * The preset props of the start picker: one second after the end of the latest booking. Without a
 * latest booking, the picker gets no preset.
 */
export const getStartPreset = (
  latestBooking: null | undefined | { end?: { dateTime: string } },
  presetLabel: string,
) =>
  latestBooking?.end
    ? {
        presetDate: formatISOLocale(addSeconds(new Date(latestBooking.end.dateTime), 1)),
        presetIcon: ArrowDownToLine,
        presetLabel,
      }
    : {}
