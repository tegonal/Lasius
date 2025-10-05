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

import { subMonths } from 'date-fns'
import { apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProfile } from 'lib/api/hooks/useProfile'
import { useProjects } from 'lib/api/hooks/useProjects'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useAppSettingsActions, useOnboardingDismissed } from 'stores/appSettingsStore'

/**
 * Hook to determine the user's onboarding status
 * Checks various conditions to see if the user needs onboarding guidance
 */
export const useOnboardingStatus = () => {
  const { profile } = useProfile()
  const { organisations, selectedOrganisationId } = useOrganisation()
  const { userProjects } = useProjects()
  const isDismissed = useOnboardingDismissed()
  const { dismissOnboarding, resetOnboarding } = useAppSettingsActions()

  // Check if user has ever created a booking by checking last month's data
  const lastMonthTimespan = apiTimespanFromTo(
    subMonths(new Date(), 1).toISOString(),
    new Date().toISOString(),
  )
  const { data: recentBookings, isLoading: isLoadingBookings } =
    useGetUserBookingListByOrganisation(
      selectedOrganisationId,
      lastMonthTimespan || { from: '', to: '' },
      {
        swr: {
          enabled: !!selectedOrganisationId && !!lastMonthTimespan,
        },
      },
    )

  // Check if user has multiple organisations (not just their private one)
  const hasMultipleOrganisations = organisations.length > 1

  // Check if user has any projects in the selected organisation
  const hasProjects = userProjects().length > 0

  // Check if user has set working hours for the selected organisation
  const hasWorkingHours = (() => {
    if (!profile?.organisations || !selectedOrganisationId) return false

    const currentOrg = profile.organisations.find(
      (org) => org.organisationReference.id === selectedOrganisationId,
    )

    // Check if working hours are defined and not all zero
    if (currentOrg?.plannedWorkingHours) {
      const hours = currentOrg.plannedWorkingHours
      const totalHours =
        (hours.monday || 0) +
        (hours.tuesday || 0) +
        (hours.wednesday || 0) +
        (hours.thursday || 0) +
        (hours.friday || 0) +
        (hours.saturday || 0) +
        (hours.sunday || 0)
      return totalHours > 0
    }
    return false
  })()

  // Check if user has ever created a booking (check last month)
  const hasEverBooked = !!recentBookings && recentBookings.length > 0

  // Check if we're still loading critical data
  const isLoading = isLoadingBookings || recentBookings === undefined

  // User has completed onboarding if they have:
  // - Created at least one booking
  // - Or dismissed the onboarding
  const hasCompletedOnboarding = hasEverBooked || isDismissed

  return {
    hasCompletedOnboarding,
    hasMultipleOrganisations,
    hasProjects,
    hasWorkingHours,
    hasEverBooked,
    isDismissed,
    isLoading,
    dismissOnboarding,
    resetOnboarding,
  }
}
