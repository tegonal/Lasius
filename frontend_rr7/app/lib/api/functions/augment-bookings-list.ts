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

import { differenceInMinutes, isBefore } from 'date-fns'

import { type ModelsBooking } from '~/services/api/lasius'

import { sortBookingsByDate } from './sort-bookings-by-date'

export type AugmentedBooking = ModelsBooking & {
  allowInsert?: boolean
  hasNextItem?: boolean
  isMostRecent?: boolean
  overlapsWithNext?: ModelsBooking
}

export const augmentBookingsList = (
  bookings: ModelsBooking[],
): AugmentedBooking[] => {
  const sorted = sortBookingsByDate(bookings)

  return sorted.map((booking, index) => {
    const nextBooking = sorted[index + 1]
    const isMostRecent = index === 0
    const hasNextItem = index < sorted.length - 1

    if (nextBooking && booking.end && nextBooking.end) {
      const isOverlapping =
        nextBooking.end.dateTime !== booking.start.dateTime &&
        !isBefore(
          new Date(nextBooking.end.dateTime),
          new Date(booking.start.dateTime),
        )

      const hasGap =
        differenceInMinutes(
          new Date(booking.start.dateTime),
          new Date(nextBooking.end.dateTime),
        ) > 1

      return {
        ...booking,
        allowInsert: hasGap,
        hasNextItem,
        isMostRecent,
        overlapsWithNext: isOverlapping ? nextBooking : undefined,
      }
    }

    return { ...booking, hasNextItem, isMostRecent }
  })
}
