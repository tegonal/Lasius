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

const newestFirst = (a: ModelsBooking, b: ModelsBooking) =>
  b.start.dateTime.localeCompare(a.start.dateTime)

/**
 * Orders the recent bookings of the backend by project name, with the newest first inside one
 * project. The backend keeps one booking per combination of project and tags.
 * The `dateTime` strings have the form yyyy-MM-ddTHH:mm:ss.SSS, so a string compare orders them.
 */
export const sortRecentBookings = (items: ModelsBooking[]) =>
  items.toSorted(
    (a, b) =>
      a.projectReference.key.localeCompare(b.projectReference.key, undefined, {
        sensitivity: 'base',
      }) || newestFirst(a, b),
  )
