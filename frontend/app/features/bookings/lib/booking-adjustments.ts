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
import { areTimesWithinOneMinute } from '~/lib/utils/time'
import {
  type ModelsBooking,
  type ModelsEditBookingRequest,
  type ModelsTag,
} from '~/services/api/lasius'

type BookingProjectAndTags = {
  projectId: string
  tags: ModelsTag[]
}

/** Returns the project id and the tags of a booking, with empty fallbacks. */
export const bookingProjectAndTags = (item: ModelsBooking): BookingProjectAndTags => ({
  projectId: item.projectReference?.id || '',
  tags: item.tags || [],
})

/**
 * Builds the update body that moves the start of `item` to the end of `previous`.
 * Returns null when no previous end exists or the gap is one minute or less.
 */
export const buildAdjustStartBody = (
  item: ModelsBooking,
  previous: ModelsBooking | null | undefined,
): ModelsEditBookingRequest | null => {
  const previousEnd = previous?.end?.dateTime
  if (!previousEnd || areTimesWithinOneMinute(item.start.dateTime, previousEnd)) {
    return null
  }

  const { projectId, tags } = bookingProjectAndTags(item)
  return {
    end: item.end ? formatISOLocale(new Date(item.end.dateTime)) : undefined,
    projectId,
    start: formatISOLocale(new Date(previousEnd)),
    tags,
  }
}

/**
 * Builds the update body that moves the end of `item` to the start of `next`.
 * Returns null when `item` has no end, no next start exists, or the gap is one minute or less.
 */
export const buildAdjustEndBody = (
  item: ModelsBooking,
  next: ModelsBooking | null | undefined,
): ModelsEditBookingRequest | null => {
  const nextStart = next?.start?.dateTime
  if (!(nextStart && item.end) || areTimesWithinOneMinute(item.end.dateTime, nextStart)) {
    return null
  }

  const { projectId, tags } = bookingProjectAndTags(item)
  return {
    end: formatISOLocale(new Date(nextStart)),
    projectId,
    start: formatISOLocale(new Date(item.start.dateTime)),
    tags,
  }
}
