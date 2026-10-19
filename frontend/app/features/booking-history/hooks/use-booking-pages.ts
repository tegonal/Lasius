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

import { type UIEvent, useCallback, useEffect, useRef, useState } from 'react'

import {
  appendBookingPage,
  BOOKING_PAGE_SIZE,
  type BookingListFilter,
} from '~/features/booking-history/lib/booking-list-query'
import { type ModelsBooking, type ModelsBookingPage } from '~/services/api/lasius'
import { useGetOrganisationBookingPage } from '~/services/api/lasius-hooks/organisation-bookings/organisation-bookings'
import { useGetUserBookingPage } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

const SCROLL_BEFORE_END = 50

export type BookingPageQuery = BookingListFilter & {
  dataSource: 'organisationBookings' | 'userBookings'
  from: string
  orgId: string
  to: string
}

type PagesState = {
  firstPage: ModelsBookingPage
  items: ModelsBooking[]
  // The number of rows to load again after a revalidation of the first page.
  reloadLimit?: number
  signature: string
  total: number
}

type PendingRequest = { mode: 'append' | 'replace'; signature: string }

const fromFirstPage = (firstPage: ModelsBookingPage, signature: string): PagesState => ({
  firstPage,
  items: firstPage.items,
  signature,
  total: firstPage.total,
})

/**
 * Shows the first page of the loader and loads the next pages on scroll. A response for an old
 * filter signature is dropped. A revalidation reloads as many rows as the list shows.
 */
export const useBookingPages = ({
  firstPage,
  query,
  signature,
}: {
  firstPage: ModelsBookingPage
  query: BookingPageQuery
  signature: string
}) => {
  const [state, setState] = useState(() => fromFirstPage(firstPage, signature))
  const pendingReference = useRef<null | PendingRequest>(null)
  const signatureReference = useRef(signature)
  useEffect(() => {
    signatureReference.current = signature
  })

  if (state.signature !== signature) {
    setState(fromFirstPage(firstPage, signature))
  } else if (state.firstPage !== firstPage) {
    setState({
      ...fromFirstPage(firstPage, signature),
      items: appendBookingPage(firstPage.items, state.items.slice(firstPage.items.length)),
      reloadLimit: state.items.length > firstPage.items.length ? state.items.length : undefined,
    })
  }

  const onSuccess = (page: ModelsBookingPage) => {
    const pending = pendingReference.current
    pendingReference.current = null
    if (!pending || pending.signature !== signatureReference.current) return
    setState((previous) => ({
      ...previous,
      items:
        pending.mode === 'replace' ? page.items : appendBookingPage(previous.items, page.items),
      reloadLimit: pending.mode === 'replace' ? undefined : previous.reloadLimit,
      total: page.total,
    }))
  }
  const { isLoading: isUserPageLoading, submit: submitUserPage } = useGetUserBookingPage({
    onSuccess,
  })
  const { isLoading: isOrganisationPageLoading, submit: submitOrganisationPage } =
    useGetOrganisationBookingPage({ onSuccess })
  const isLoading = isUserPageLoading || isOrganisationPageLoading

  const { dataSource, from, orgId, projectId, tagId, to, userId } = query
  const requestPage = useCallback(
    (skip: number, limit: number) => {
      const parameters = { from, limit, projectId, skip, tagId, to, withSummary: false }
      if (dataSource === 'organisationBookings') {
        submitOrganisationPage({ orgId, params: { ...parameters, userId } })
      } else {
        submitUserPage({ orgId, params: parameters })
      }
    },
    [dataSource, from, orgId, projectId, submitOrganisationPage, submitUserPage, tagId, to, userId],
  )

  const { reloadLimit } = state
  useEffect(() => {
    if (reloadLimit === undefined) return
    pendingReference.current = { mode: 'replace', signature: signatureReference.current }
    requestPage(0, reloadLimit)
  }, [reloadLimit, requestPage])

  const hasMore = state.items.length < state.total
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget
    if (scrollHeight - scrollTop - clientHeight >= SCROLL_BEFORE_END) return
    if (!hasMore || isLoading) return
    pendingReference.current = { mode: 'append', signature }
    requestPage(state.items.length, BOOKING_PAGE_SIZE)
  }

  return { hasMore, isLoading, items: state.items, onScroll, total: state.total }
}
