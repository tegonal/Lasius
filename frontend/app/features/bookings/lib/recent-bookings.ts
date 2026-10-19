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

import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'

export const RECENT_BOOKINGS_DAYS = 7
const RECENT_BOOKINGS_LIMIT = 20

const presetKey = (booking: ModelsBooking) =>
  `${booking.projectReference.id}-${booking.tags
    .map((tag) => tag.id)
    .toSorted((a, b) => a.localeCompare(b))
    .join(',')}`

const newestFirst = (a: ModelsBooking, b: ModelsBooking) =>
  b.start.dateTime.localeCompare(a.start.dateTime)

/**
 * Returns the newest booking for each combination of project and tags, up to `limit`.
 * The result is ordered by project name, and the newest comes first inside one project.
 * The `dateTime` strings have the form yyyy-MM-ddTHH:mm:ss.SSS, so a string compare orders them.
 */
export const deduplicateBookings = (items: ModelsBooking[], limit = RECENT_BOOKINGS_LIMIT) => {
  const seen = new Set<string>()
  const unique: ModelsBooking[] = []
  for (const booking of items.toSorted(newestFirst)) {
    const key = presetKey(booking)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(booking)
      if (unique.length >= limit) break
    }
  }
  return unique.toSorted(
    (a, b) =>
      a.projectReference.key.localeCompare(b.projectReference.key, undefined, {
        sensitivity: 'base',
      }) || newestFirst(a, b),
  )
}
