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

import { BookingItem } from 'components/features/user/index/list/bookingItem'
import { BookingListWrapper } from 'components/features/user/index/list/bookingListWrapper'
import { AnimateList } from 'components/ui/animations/motion/animateList'
import { BookingListEmptyNever } from 'components/ui/data-display/fetchState/bookingListEmptyNever'
import { BookingListEmptyToday } from 'components/ui/data-display/fetchState/bookingListEmptyToday'
import { DataFetchValidates } from 'components/ui/data-display/fetchState/dataFetchValidates'
import { subMonths } from 'date-fns'
import { apiTimespanDay, apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { stringHash } from 'lib/utils/string/stringHash'
import { DEV } from 'projectConfig/constants'
import React, { useMemo } from 'react'
import { useSelectedDate } from 'stores/calendarStore'
import { useIsClient } from 'usehooks-ts'

export const BookingListSelectedDay: React.FC = () => {
  const { selectedOrganisationId } = useOrganisation()
  const isClient = useIsClient()
  const selectedDate = useSelectedDate()

  const { data, isValidating } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    apiTimespanDay(selectedDate),
    {
      swr: {
        enabled: !!selectedOrganisationId,
      },
    },
  )

  // Check if user has any bookings in the last month to determine if they've ever booked
  const lastMonthDate = useMemo(
    () => subMonths(new Date(selectedDate), 1).toISOString(),
    [selectedDate],
  )
  const lastMonthTimespan = useMemo(
    () => apiTimespanFromTo(lastMonthDate, selectedDate),
    [lastMonthDate, selectedDate],
  )

  const { data: lastMonthData } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    lastMonthTimespan || { from: '', to: '' },
    {
      swr: {
        enabled: !!selectedOrganisationId && !!lastMonthTimespan,
      },
    },
  )

  const sortedList = useMemo(() => augmentBookingsList(data || []), [data])

  if (!isClient) return null

  const hasNoData = !data || data?.length === 0
  const hasNeverBooked = !lastMonthData || lastMonthData?.length === 0

  return (
    <BookingListWrapper>
      <DataFetchValidates isValidating={isValidating} />
      {hasNoData ? (
        DEV ? (
          // In dev mode, show both placeholders for testing
          <>
            <div className="text-warning bg-warning/10 mx-4 mb-2 rounded-lg p-3 text-center text-xs">
              DEV MODE: Both empty state components are always shown for testing purposes
            </div>
            <BookingListEmptyNever />
            <BookingListEmptyToday />
          </>
        ) : // In production, show appropriate placeholder
        hasNeverBooked ? (
          <BookingListEmptyNever />
        ) : (
          <BookingListEmptyToday />
        )
      ) : (
        <AnimateList popLayout>
          {sortedList.map((item, index) => (
            <BookingItem key={stringHash(item)} item={item} nextItem={sortedList[index + 1]} />
          ))}
        </AnimateList>
      )}
    </BookingListWrapper>
  )
}
