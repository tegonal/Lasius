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

import { data } from 'react-router'

import { ColumnCenter, ColumnRight, innerGridClasses } from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { BookingCurrent } from '~/features/bookings/components/booking-current'
import { BookingListSelectedDay } from '~/features/bookings/components/booking-list-selected-day'
import { BookingDayStatsProgressBar } from '~/features/home/components/booking-day-stats-progress-bar'
import { IndexColumnTabs } from '~/features/home/components/index-column-tabs'
import { OnboardingTutorial } from '~/features/onboarding/components/onboarding-tutorial'
import { augmentBookingsList } from '~/lib/api/functions/augment-bookings-list'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getUserClock } from '~/lib/cookies/time-zone-cookie.server'
import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { createServerTiming } from '~/lib/server-timing.server'
import { apiTimespanDay, getWorkingHoursWeekdayString, isoDateOrFallback } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { getOrganisationUserList } from '~/services/api/lasius/organisations/organisations'
import {
  getUserBookingCurrent,
  getUserBookingCurrentListByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { getFavoriteBookingList } from '~/services/api/lasius/user-favorites/user-favorites'
import { mergeAuthHeaders } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.layout._index'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const timing = createServerTiming()
  // The profile gives the planned working hours and the selected organisation
  const { auth, headers, selectedOrg, selectedOrgId } = await timing.measure(
    'context',
    loadOrganisationContext(request, url),
  )

  const selectedDate = isoDateOrFallback(url.searchParams.get('date'), getUserClock(request).today)
  const dayTimespan = apiTimespanDay(selectedDate)

  // Fetch day bookings, current booking, favorites, org current bookings, and users in parallel
  const [
    dayBookingsResponse,
    currentBookingResponse,
    favoritesResponse,
    orgCurrentBookingsResponse,
    orgUsersResponse,
  ] = await Promise.all([
    timing.measure(
      'day',
      getUserBookingListByOrganisation(selectedOrgId, dayTimespan, { headers }),
    ),
    timing.measure('current', getUserBookingCurrent({ headers })),
    timing.measure('favorites', getFavoriteBookingList(selectedOrgId, { headers })),
    timing.measure(
      'orgCurrent',
      getUserBookingCurrentListByOrganisation(selectedOrgId, { headers }),
    ),
    timing.measure('orgUsers', getOrganisationUserList(selectedOrgId, { headers })),
  ])

  const dayBookings = dayBookingsResponse.data ?? []
  const currentBooking = currentBookingResponse.data
  const favorites = favoritesResponse.data?.favorites ?? []
  const orgCurrentBookings = orgCurrentBookingsResponse.data?.timeBookings ?? []
  const orgUsers = orgUsersResponse.data ?? []

  // An organisation without planned hours gets 0, not the 8-hour default of the stats pages
  const plannedHoursDay =
    selectedOrg?.plannedWorkingHours[getWorkingHoursWeekdayString(selectedDate)] ?? 0

  // Compute day summary
  const daySummary = getModelsBookingSummary(dayBookings)
  const { fulfilledPercentage, progressBarPercentage } = getExpectedVsBookedPercentage(
    plannedHoursDay,
    daySummary.hours,
  )

  // Augment bookings list for display
  const augmentedBookings = augmentBookingsList(dayBookings)

  return data(
    {
      augmentedBookings,
      currentBooking,
      daySummary: {
        ...daySummary,
        fulfilledPercentage,
        plannedWorkingHours: plannedHoursDay,
        progressBarPercentage,
      },
      favorites,
      orgCurrentBookings,
      orgUsers,
      selectedDate,
      selectedOrgId,
    },
    { headers: mergeAuthHeaders(auth, { 'Server-Timing': timing.header() }) },
  )
}

// A day that the user saw before shows at once. A change request or a WebSocket event clears the cache.
export const clientLoader = ({ request, serverLoader }: Route.ClientLoaderArgs) =>
  cachedServerLoader('routes/user.layout._index', request, serverLoader)
clientLoader.hydrate = false

// React Router sends a loader header only through this export, for the page and for its .data request.
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  const serverTiming = loaderHeaders.get('Server-Timing')
  return serverTiming ? { 'Server-Timing': serverTiming } : {}
}

export default function HomeIndex({ loaderData }: Route.ComponentProps) {
  const { favorites, orgCurrentBookings, orgUsers, selectedOrgId } = loaderData

  return (
    <div className={innerGridClasses}>
      <OnboardingTutorial />
      <ColumnCenter>
        <div className="grid h-full w-full grid-rows-[min-content_min-content_auto] gap-1 pb-20 max-md:grid-rows-[min-content_auto] md:pb-0">
          <BookingDayStatsProgressBar />
          <div className="hidden md:block">
            <BookingCurrent />
          </div>
          <ScrollArea>
            <BookingListSelectedDay />
          </ScrollArea>
        </div>
      </ColumnCenter>
      <ColumnRight>
        <IndexColumnTabs
          favorites={favorites}
          orgBookings={orgCurrentBookings}
          selectedOrgId={selectedOrgId}
          users={orgUsers}
        />
      </ColumnRight>
    </div>
  )
}
