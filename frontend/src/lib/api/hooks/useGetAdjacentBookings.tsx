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

import { apiTimespanDay } from 'lib/api/apiDateHandling'
import { sortBookingsByDate } from 'lib/api/functions/sortBookingsByDate'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useMemo } from 'react'

/**
 * Custom hook for finding the adjacent bookings (previous and next) relative to a given booking.
 * Fetches all bookings for the same day as the provided booking and identifies its neighbors
 * in chronological order.
 *
 * @param item - The booking to find adjacent bookings for (or undefined)
 *
 * @returns Object containing:
 *   - previous: The chronologically previous booking (later in time, or null if none)
 *   - next: The chronologically next booking (earlier in time, or null if none)
 *
 * @example
 * const currentBooking = { id: '123', start: { dateTime: '2025-01-15T10:00:00Z' }, ... }
 * const { previous, next } = useGetAdjacentBookings(currentBooking)
 *
 * if (previous) {
 *   console.log('Previous booking:', previous.id)
 * }
 * if (next) {
 *   console.log('Next booking:', next.id)
 * }
 *
 * @remarks
 * - Bookings are sorted in reverse chronological order (newest first)
 * - Returns null for previous/next if no adjacent bookings exist
 * - Uses the selected organisation from the organisation store
 * - Only fetches bookings for the same day as the provided booking
 */
export const useGetAdjacentBookings = (item: ModelsBooking | undefined) => {
  const { selectedOrganisationId } = useOrganisation()
  const { data: bookings } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    apiTimespanDay(item?.start.dateTime || formatISOLocale(new Date())),
  )

  const sorted = sortBookingsByDate(bookings || [])
  const indexCurrent = sorted.findIndex((b) => b.id === item?.id)
  const data = useMemo(
    () => ({
      previous: sorted[indexCurrent + 1] || null,
      next: sorted[indexCurrent - 1] || null,
    }),
    [sorted, indexCurrent],
  )

  return data
}
