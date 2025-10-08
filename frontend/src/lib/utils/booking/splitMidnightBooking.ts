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

import { addDays, endOfDay, isSameDay, startOfDay } from 'date-fns'
import {
  addUserBookingByOrganisation,
  stopUserBookingCurrent,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { formatISOLocale } from 'lib/utils/date/dates'

import type { ModelsBooking } from 'lib/api/lasius'

/**
 * Stops a booking that may span over midnight, automatically splitting it into two bookings if needed.
 *
 * If the booking spans midnight:
 * - First booking: start → 23:59:59 on the start day
 * - Second booking: 00:00:00 → end on the next day
 *
 * @param orgId - Organization ID
 * @param booking - Current booking data
 * @param endTime - The time when the booking should end
 * @returns Promise that resolves when all API calls are complete
 */
export const stopBookingWithMidnightSplit = async (
  orgId: string,
  booking: ModelsBooking,
  endTime: Date,
): Promise<void> => {
  const startDate = new Date(booking.start.dateTime)

  // Check if booking spans midnight
  const spansMidnight = !isSameDay(startDate, endTime)

  if (!spansMidnight) {
    // Normal case: stop booking at end time
    await stopUserBookingCurrent(orgId, booking.id, {
      end: formatISOLocale(endTime),
    })
    return
  }

  // Midnight-spanning case: split into two bookings
  const endOfStartDay = endOfDay(startDate)
  const startOfNextDay = startOfDay(addDays(startDate, 1))

  // Stop current booking at 23:59:59 of the start day
  await stopUserBookingCurrent(orgId, booking.id, {
    end: formatISOLocale(endOfStartDay),
  })

  // Create second booking for the next day (00:00:00 → end time)
  await addUserBookingByOrganisation(orgId, {
    projectId: booking.projectReference.id,
    tags: booking.tags,
    start: formatISOLocale(startOfNextDay),
    end: formatISOLocale(endTime),
  })
}
