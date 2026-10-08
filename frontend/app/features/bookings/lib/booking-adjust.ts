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
import { type ModelsBooking } from '~/services/api/lasius'

/**
 * The update body that moves the start or the end of a booking and keeps its other values.
 * The times are booking date-time values. A booking without an end keeps no end.
 */
export const getAdjustedBookingBody = (
  booking: ModelsBooking,
  times: { end?: string; start?: string },
) => {
  const end = times.end ?? booking.end?.dateTime
  return {
    end: end ? formatISOLocale(new Date(end)) : undefined,
    projectId: booking.projectReference?.id || '',
    start: formatISOLocale(new Date(times.start ?? booking.start.dateTime)),
    tags: booking.tags || [],
  }
}
