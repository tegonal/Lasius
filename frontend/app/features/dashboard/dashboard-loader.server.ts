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

import { format } from 'date-fns'

import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { computeWorkHealthMetrics } from '~/lib/api/functions/compute-work-health-metrics.server'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getDailyTotalsSummary } from '~/lib/api/functions/get-models-booking-summary'
import {
  getPlannedHoursForRange,
  getWeeklyPlannedHours,
} from '~/lib/api/functions/get-planned-working-hours'
import { getUserClock } from '~/lib/cookies/time-zone-cookie.server'
import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { formatDateTimeToURLParameter, isoDateOrFallback } from '~/lib/utils/dates'
import { type ModelsDailyBookingTotal } from '~/services/api/lasius'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingDailyTotals,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { mergeAuthHeaders, type requireUser } from '~/services/auth/auth-helpers.server'

/**
 * Shared context extracted from all dashboard period loaders.
 * Handles auth, profile, org selection, planned hours, and date parsing.
 */
export const loadDashboardContext = async (request: Request, url: URL) => {
  const { auth, headers, selectedOrg, selectedOrgId } = await loadOrganisationContext(request, url)

  // Extract planned working hours for the selected org
  const plannedHours = selectedOrg?.plannedWorkingHours
    ? { ...selectedOrg.plannedWorkingHours }
    : null

  const selectedDate = isoDateOrFallback(url.searchParams.get('date'), getUserClock(request).today)

  return {
    auth,
    headers,
    plannedHours,
    selectedDate,
    selectedOrgId,
  }
}

/**
 * Compute the standard stats object from the daily totals and the expected hours.
 */
export const computeDashboardStats = (
  dailyTotals: ModelsDailyBookingTotal[],
  expectedHours: number,
) => {
  const summary = getDailyTotalsSummary(dailyTotals)
  const { fulfilledPercentage } = getExpectedVsBookedPercentage(expectedHours, summary.hours)
  return {
    bookings: summary.elements,
    expectedHours,
    fulfilledPercentage,
    hours: summary.hours,
  }
}

/**
 * Loads the stats, the top 5 projects and the weekly trend of a range of several weeks, for the
 * 6-month and the year dashboard.
 */
export const loadWeeklyRangeDashboard = async (
  context: Awaited<ReturnType<typeof loadDashboardContext>>,
  range: { end: Date; start: Date; weeks: number },
) => {
  const { headers, plannedHours, selectedDate, selectedOrgId } = context
  const timespan = {
    from: formatDateTimeToURLParameter(range.start),
    to: formatDateTimeToURLParameter(range.end),
  }
  const [dailyTotalsResponse, projectStatsResponse] = await Promise.all([
    getUserBookingDailyTotals(selectedOrgId, timespan, { headers }),
    getUserBookingAggregatedStatsByOrganisation(
      selectedOrgId,
      {
        from: format(range.start, 'yyyy-MM-dd'),
        granularity: 'Week',
        source: 'project',
        to: format(range.end, 'yyyy-MM-dd'),
      },
      { headers },
    ),
  ])
  const dailyTotals = dailyTotalsResponse.data ?? []

  const { weeklyData } = computeWorkHealthMetrics(
    dailyTotals,
    getWeeklyPlannedHours(plannedHours),
    range.weeks,
    selectedDate,
  )
  const expectedHours = getPlannedHoursForRange(range.start, range.end, plannedHours)
  return {
    stats: computeDashboardStats(dailyTotals, expectedHours),
    topProjects: aggregateProjectHours(projectStatsResponse.data ?? [], 5),
    weeklyData,
  }
}

/**
 * Return merged auth headers for the loader response.
 */
export const dashboardResponseHeaders = (auth: Awaited<ReturnType<typeof requireUser>>) =>
  mergeAuthHeaders(auth)
