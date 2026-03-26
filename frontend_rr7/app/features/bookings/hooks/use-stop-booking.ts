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
import { useCallback, useRef } from 'react'

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsTag } from '~/services/api/lasius'
import {
  useAddUserBookingByOrganisation,
  useStopUserBookingCurrent,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type StopBookingPayload = {
  bookingId: string
  end: string
  orgId: string
  projectId: string
  start: string
  tags: ModelsTag[]
}

/**
 * Stops a booking. If the booking spans midnight, splits it:
 * stops at end of start day, then adds a next-day booking.
 * Chains useStopUserBookingCurrent → useAddUserBookingByOrganisation (conditional).
 */
export function useStopBooking() {
  const addApi = useAddUserBookingByOrganisation()
  const pendingAddRef = useRef<null | {
    end: string
    orgId: string
    projectId: string
    start: string
    tags: ModelsTag[]
  }>(null)

  const stopApi = useStopUserBookingCurrent({
    onSuccess: () => {
      if (pendingAddRef.current) {
        const { end, orgId, projectId, start, tags } = pendingAddRef.current
        pendingAddRef.current = null
        addApi.submit({
          body: { end, projectId, start, tags },
          orgId,
        })
      }
    },
  })

  const submit = useCallback(
    (payload: StopBookingPayload) => {
      const { bookingId, end, orgId, projectId, start, tags } = payload
      const startDate = new Date(start)
      const endDate = new Date(end)
      const spansMidnight = !isSameDay(startDate, endDate)

      if (spansMidnight) {
        const eod = formatISOLocale(endOfDay(startDate))
        const nextDayStart = formatISOLocale(startOfDay(addDays(startDate, 1)))

        // Queue the next-day booking, then stop at end-of-day
        pendingAddRef.current = {
          end: formatISOLocale(endDate),
          orgId,
          projectId,
          start: nextDayStart,
          tags,
        }
        stopApi.submit({
          body: { end: eod },
          bookingId,
          orgId,
        })
      } else {
        stopApi.submit({
          body: { end },
          bookingId,
          orgId,
        })
      }
    },
    [stopApi],
  )

  const state =
    stopApi.state !== 'idle' || addApi.state !== 'idle' ? 'submitting' : 'idle'

  return { state, submit }
}
