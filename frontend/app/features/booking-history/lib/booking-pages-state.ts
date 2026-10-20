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

import { appendBookingPage } from '~/features/booking-history/lib/booking-list-query'
import { type ModelsBooking, type ModelsBookingPage } from '~/services/api/lasius'

export type PageRequestMode = 'append' | 'replace'

export type PagesState = {
  firstPage: ModelsBookingPage
  items: ModelsBooking[]
  // The number of rows to load again after a revalidation of the first page.
  reloadLimit?: number
  signature: string
  total: number
}

export const initialPagesState = (firstPage: ModelsBookingPage, signature: string): PagesState => ({
  firstPage,
  items: firstPage.items,
  signature,
  total: firstPage.total,
})

/**
 * Returns the state for a new loader result, or null when the state already holds it. A new
 * filter starts again from the first page. A revalidation keeps the loaded rows and asks to
 * reload them.
 */
export const syncFirstPage = (
  state: PagesState,
  firstPage: ModelsBookingPage,
  signature: string,
): null | PagesState => {
  if (state.signature !== signature) return initialPagesState(firstPage, signature)
  if (state.firstPage === firstPage) return null
  const loadedRows = state.items.length
  return {
    ...initialPagesState(firstPage, signature),
    items: appendBookingPage(firstPage.items, state.items.slice(firstPage.items.length)),
    reloadLimit: loadedRows > firstPage.items.length ? loadedRows : undefined,
  }
}

/** Adds a scroll page, or replaces the rows with a reload. */
export const applyPage = (
  state: PagesState,
  page: ModelsBookingPage,
  mode: PageRequestMode,
): PagesState => ({
  ...state,
  items: mode === 'replace' ? page.items : appendBookingPage(state.items, page.items),
  reloadLimit: mode === 'replace' ? undefined : state.reloadLimit,
  total: page.total,
})
