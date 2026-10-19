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

import { type ShouldRevalidateFunctionArgs } from 'react-router'

import { parseTagsParameter } from '~/features/booking-history/lib/booking-history-search-parameters'
import { isSameLocation } from '~/features/stats/stats-loader'
import { isProxyReadRequest } from '~/lib/api/proxy-revalidation'
import { type ModelsBooking } from '~/services/api/lasius'

/** The number of bookings that the list loads at once. */
export const BOOKING_PAGE_SIZE = 100

export type BookingListFilter = {
  projectId?: string
  tagId: string[]
  userId?: string
}

const FILTER_PARAMETERS = ['from', 'to', 'dateRange', 'tags', 'projectId', 'userId'] as const

/** Reads the project, user and tag filters of the list from the URL. */
export const getBookingListFilter = (searchParameters: URLSearchParams): BookingListFilter => ({
  projectId: searchParameters.get('projectId') || undefined,
  tagId: parseTagsParameter(searchParameters.get('tags') ?? '').map((tag) => tag.id),
  userId: searchParameters.get('userId') || undefined,
})

/** Names the filtered set of a list URL. Two URLs with the same signature show the same rows. */
export const getBookingListSignature = (searchParameters: URLSearchParams) =>
  FILTER_PARAMETERS.map((name) => `${name}=${searchParameters.get(name) ?? ''}`).join('&')

/**
 * Reruns a list loader only when a filter changes. A scroll page is a GET call through the
 * proxy and needs no revalidation. Client-safe — must NOT be in a .server.ts file.
 */
export const listShouldRevalidate = (arguments_: ShouldRevalidateFunctionArgs) => {
  const { currentUrl, defaultShouldRevalidate, formMethod, nextUrl } = arguments_
  if (isProxyReadRequest(arguments_)) return false
  if (formMethod) return defaultShouldRevalidate
  // The same URL means a revalidation, for example after a WebSocket event, not a navigation.
  if (isSameLocation(currentUrl, nextUrl)) return defaultShouldRevalidate
  if (
    getBookingListSignature(currentUrl.searchParams) ===
    getBookingListSignature(nextUrl.searchParams)
  ) {
    return false
  }
  return defaultShouldRevalidate
}

/** Appends a page and drops a booking that an earlier page holds already. */
export const appendBookingPage = (loaded: ModelsBooking[], page: ModelsBooking[]) => {
  const loadedIds = new Set(loaded.map((booking) => booking.id))
  return [...loaded, ...page.filter((booking) => !loadedIds.has(booking.id))]
}
