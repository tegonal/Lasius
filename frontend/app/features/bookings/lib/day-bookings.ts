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

import { isSameDay } from 'date-fns'

type DayBooking = { end?: null | { dateTime: string }; id: string; start: { dateTime: string } }

/** The day list holds the newest booking first, so the booking before `id` has the next index. */
export const getAdjacentBookings = <T extends DayBooking>(bookings: T[], id: string) => {
  const index = bookings.findIndex((b) => b.id === id)
  if (index === -1) return { next: undefined, previous: undefined }
  return { next: bookings[index - 1], previous: bookings[index + 1] }
}

/**
 * The newest booking that ends on `day`. A running booking has no end. With `startedBefore`, only a
 * booking that starts before that time counts.
 */
export const getLatestEndedBooking = <T extends DayBooking>(
  bookings: T[],
  day: Date,
  startedBefore?: string,
) =>
  bookings.find(
    (b) =>
      !!b.end?.dateTime &&
      isSameDay(new Date(b.end.dateTime), day) &&
      (!startedBefore || new Date(b.start.dateTime) < new Date(startedBefore)),
  )
