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

import { type ModelsBooking, type ModelsBookingSummary } from '~/services/api/lasius'

import { getExtendedModelsBookingList } from './get-extended-models-booking-list'

const MS_PER_HOUR = 1000 * 60 * 60

const roundHours = (hours: number) => Math.round(hours * 100) / 100

export const getModelsBookingSummary = (list: ModelsBooking[]) => {
  const hours = roundHours(
    getExtendedModelsBookingList(list).reduce(
      (accumulator, item) => accumulator + item.duration,
      0,
    ),
  )
  const elements = list.length
  return { elements, hours }
}

export const EMPTY_BOOKING_SUMMARY: ModelsBookingSummary = {
  bookings: 0,
  distinctProjects: 0,
  distinctUsers: 0,
  durationMs: 0,
}

/** Gives the summary of the backend the shape of `getModelsBookingSummary`. */
export const getBookingSummaryFromApi = (summary: ModelsBookingSummary) => ({
  elements: summary.bookings,
  hours: roundHours(summary.durationMs / MS_PER_HOUR),
})
