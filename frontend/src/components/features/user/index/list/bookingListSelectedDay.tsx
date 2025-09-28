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
import { DataFetchEmpty } from 'components/ui/data-display/fetchState/dataFetchEmpty'
import { DataFetchValidates } from 'components/ui/data-display/fetchState/dataFetchValidates'
import { apiTimespanDay } from 'lib/api/apiDateHandling'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { stringHash } from 'lib/utils/string/stringHash'
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

  const sortedList = useMemo(() => augmentBookingsList(data || []), [data])

  if (!isClient) return null

  const hasNoData = !data || data?.length === 0

  return (
    <BookingListWrapper>
      <DataFetchValidates isValidating={isValidating} />
      {hasNoData ? (
        <DataFetchEmpty />
      ) : (
        <AnimateList popLayout>
          {sortedList.map((item) => (
            <BookingItem key={stringHash(item)} item={item} />
          ))}
        </AnimateList>
      )}
    </BookingListWrapper>
  )
}
