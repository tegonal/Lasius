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
  BOOKING_PAGE_SIZE,
  type BookingListFilter,
} from '~/features/booking-history/lib/booking-list-query'
import {
  applyPage,
  initialPagesState,
  type PageRequestMode,
  syncFirstPage,
} from '~/features/booking-history/lib/booking-pages-state'
import { type ModelsBookingPage } from '~/services/api/lasius'
import { useGetOrganisationBookingPage } from '~/services/api/lasius-hooks/organisation-bookings/organisation-bookings'
import { useGetUserBookingPage } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

const SCROLL_BEFORE_END = 50

export type BookingPageQuery = BookingListFilter & {
  dataSource: 'organisationBookings' | 'userBookings'
  from: string
  orgId: string
  to: string
}

/** Sends one page request of the user or the organisation list. */
const useBookingPageRequest = (
  query: BookingPageQuery,
  onSuccess: (page: ModelsBookingPage) => void,
) => {
  const { isLoading: isUserPageLoading, submit: submitUserPage } = useGetUserBookingPage({
    onSuccess,
  })
  const { isLoading: isOrganisationPageLoading, submit: submitOrganisationPage } =
    useGetOrganisationBookingPage({ onSuccess })

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

  return { isLoading: isUserPageLoading || isOrganisationPageLoading, requestPage }
}

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
  const [state, setState] = useState(() => initialPagesState(firstPage, signature))
  const pendingReference = useRef<null | { mode: PageRequestMode; signature: string }>(null)
  const signatureReference = useRef(signature)
  useEffect(() => {
    signatureReference.current = signature
  })

  const synced = syncFirstPage(state, firstPage, signature)
  if (synced) setState(synced)

  const onSuccess = (page: ModelsBookingPage) => {
    const pending = pendingReference.current
    pendingReference.current = null
    if (pending?.signature !== signatureReference.current) return
    setState((previous) => applyPage(previous, page, pending.mode))
  }
  const { isLoading, requestPage } = useBookingPageRequest(query, onSuccess)

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
