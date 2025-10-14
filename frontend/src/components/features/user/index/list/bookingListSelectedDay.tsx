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
import { OnboardingTutorial } from 'components/features/user/index/onboarding/onboardingTutorial'
import { AnimateList } from 'components/ui/animations/motion/animateList'
import { BookingListEmptyNever } from 'components/ui/data-display/fetchState/bookingListEmptyNever'
import { BookingListEmptyToday } from 'components/ui/data-display/fetchState/bookingListEmptyToday'
import { DataFetchValidates } from 'components/ui/data-display/fetchState/dataFetchValidates'
import { subMonths } from 'date-fns'
import { apiTimespanDay, apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useOnboardingStatus } from 'lib/hooks/useOnboardingStatus'
import { stringHash } from 'lib/utils/string/stringHash'
import { getIsDev } from 'projectConfig/constants'
import React, { useMemo } from 'react'
import { useSelectedDate } from 'stores/calendarStore'
import { useIsClient } from 'usehooks-ts'

export const BookingListSelectedDay: React.FC = () => {
  const { selectedOrganisationId } = useOrganisation()
  const isClient = useIsClient()
  const selectedDate = useSelectedDate()
  const { isDismissed } = useOnboardingStatus()

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

  const { data: lastMonthData, isValidating: isValidatingLastMonth } =
    useGetUserBookingListByOrganisation(
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

  // Wait for initial data to load before determining empty state
  const isInitialLoad = data === undefined || (lastMonthData === undefined && !!lastMonthTimespan)
  const hasNoData = !data || data?.length === 0
  const hasNeverBooked = !lastMonthData || lastMonthData?.length === 0

  return (
    <BookingListWrapper>
      <DataFetchValidates isValidating={isValidating || isValidatingLastMonth} />
      {isInitialLoad ? null : hasNoData ? (
        getIsDev() ? (
          // In dev mode, show all empty states for testing
          <>
            <div className="text-warning bg-warning/10 mx-4 mb-2 rounded-lg p-3 text-center text-xs">
              DEV MODE: All empty state components are shown for testing purposes
            </div>
            <OnboardingTutorial />
            <div className="my-4" />
            <BookingListEmptyNever />
            <div className="my-4" />
            <BookingListEmptyToday />
          </>
        ) : // In production, show appropriate placeholder
        hasNeverBooked ? (
          // Show tutorial if not dismissed, otherwise show "never booked" empty state
          isDismissed ? (
            <BookingListEmptyNever />
          ) : (
            <OnboardingTutorial />
          )
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
