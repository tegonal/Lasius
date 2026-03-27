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

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { BookingCurrent } from '~/features/bookings/components/booking-current'
import { BookingListSelectedDay } from '~/features/bookings/components/booking-list-selected-day'
import { BookingDayStatsProgressBar } from '~/features/home/components/booking-day-stats-progress-bar'
import { IndexColumnTabs } from '~/features/home/components/index-column-tabs'
import { OnboardingTutorial } from '~/features/onboarding/components/onboarding-tutorial'
import { augmentBookingsList } from '~/lib/api/functions/augment-bookings-list'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { apiTimespanDay, formatISOLocale } from '~/lib/utils/dates'
import { getOrganisationUserList } from '~/services/api/lasius/organisations/organisations'
import {
  getUserBookingCurrent,
  getUserBookingCurrentListByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { getFavoriteBookingList } from '~/services/api/lasius/user-favorites/user-favorites'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.layout._index'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  // Get user profile for planned working hours + org selection
  const profile = await getUserProfile({ headers })
  const user = profile.data
  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''

  // Read selected date from URL search param, fall back to today
  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const selectedDate =
    dateParam && !Number.isNaN(new Date(dateParam).getTime())
      ? dateParam
      : formatISOLocale(new Date())
  const dayTimespan = apiTimespanDay(selectedDate)

  // Fetch day bookings, current booking, favorites, org current bookings, and users in parallel
  const [
    dayBookingsRes,
    currentBookingRes,
    favoritesRes,
    orgCurrentBookingsRes,
    orgUsersRes,
  ] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, dayTimespan, { headers }),
    getUserBookingCurrent({ headers }),
    getFavoriteBookingList(selectedOrgId, { headers }),
    getUserBookingCurrentListByOrganisation(selectedOrgId, { headers }),
    getOrganisationUserList(selectedOrgId, { headers }),
  ])

  const dayBookings = dayBookingsRes.data ?? []
  const currentBooking = currentBookingRes.data
  const favorites = favoritesRes.data?.favorites ?? []
  const orgCurrentBookings = orgCurrentBookingsRes.data?.timeBookings ?? []
  const orgUsers = orgUsersRes.data ?? []

  // Compute planned working hours for the selected day's weekday
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const plannedHours = selectedOrg?.plannedWorkingHours
  const weekdayNames: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  }
  const selectedWeekday =
    weekdayNames[new Date(selectedDate).getDay()] ?? 'monday'
  const plannedHoursDay =
    (plannedHours as Record<string, number> | undefined)?.[selectedWeekday] ?? 0

  // Compute day summary
  const daySummary = getModelsBookingSummary(dayBookings)
  const { fulfilledPercentage, progressBarPercentage } =
    getExpectedVsBookedPercentage(plannedHoursDay, daySummary.hours)

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
    { headers: mergeAuthHeaders(auth) },
  )
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
