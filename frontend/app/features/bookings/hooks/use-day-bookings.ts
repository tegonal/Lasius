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

import { useHomeLoaderData } from '~/features/bookings/hooks/use-home-loader-data'
import { getAdjacentBookings, getLatestEndedBooking } from '~/features/bookings/lib/day-bookings'
import { type ModelsBooking } from '~/services/api/lasius'

/** The bookings before and after `item` in the day list of the home route. */
export const useAdjacentBookings = (item: ModelsBooking) =>
  getAdjacentBookings(useHomeLoaderData()?.augmentedBookings ?? [], item.id)

/**
 * The latest booking that ends on `day`, from the day list of the home route. The list holds the
 * selected day, so another `day` gives undefined. Off the home route, the result is undefined.
 */
export const useLatestEndedBooking = (day: Date, startedBefore?: string) =>
  getLatestEndedBooking(useHomeLoaderData()?.augmentedBookings ?? [], day, startedBefore)
