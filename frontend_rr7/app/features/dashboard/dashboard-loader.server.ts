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

import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * Shared context extracted from all dashboard period loaders.
 * Handles auth, profile, org selection, planned hours, and date parsing.
 */
export const loadDashboardContext = async (request: Request) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const profile = await getUserProfile({ headers })
  const user = profile.data

  // Determine selected org
  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''

  // Extract planned working hours for the selected org
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const plannedHours = selectedOrg?.plannedWorkingHours
    ? { ...selectedOrg.plannedWorkingHours }
    : null

  // Read selected date from URL search param, fall back to today
  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const selectedDate =
    dateParam && !Number.isNaN(new Date(dateParam).getTime())
      ? dateParam
      : formatISOLocale(new Date())

  return {
    auth,
    headers,
    plannedHours,
    selectedDate,
    selectedOrgId,
    url,
  }
}

/**
 * Compute the standard stats object from bookings and expected hours.
 */
export const computeDashboardStats = (
  bookings: ModelsBooking[],
  expectedHours: number,
) => {
  const summary = getModelsBookingSummary(bookings)
  const { fulfilledPercentage } = getExpectedVsBookedPercentage(
    expectedHours,
    summary.hours,
  )
  return {
    bookings: summary.elements,
    expectedHours,
    fulfilledPercentage,
    hours: summary.hours,
  }
}

/**
 * Return merged auth headers for the loader response.
 */
export const dashboardResponseHeaders = (
  auth: Awaited<ReturnType<typeof requireUser>>,
) => mergeAuthHeaders(auth)
