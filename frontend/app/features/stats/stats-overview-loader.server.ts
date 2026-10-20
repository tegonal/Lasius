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

import { type loadStatsContext, statsResponseHeaders } from '~/features/stats/stats-loader.server'
import {
  EMPTY_BOOKING_SUMMARY,
  getBookingSummaryFromApi,
} from '~/lib/api/functions/get-models-booking-summary'
import { apiTimespanFromTo } from '~/lib/utils/dates'
import { type ModelsBookingSummary } from '~/services/api/lasius'

type StatsContext = Awaited<ReturnType<typeof loadStatsContext>>

type SummaryFetcher = (
  orgId: string,
  timespan: { from: string; to: string },
  options: { headers: HeadersInit },
) => Promise<{ data: ModelsBookingSummary }>

/** Loads the overview numbers of a stats layout with the summary endpoint of its scope. */
export const loadStatsOverview = async (context: StatsContext, fetchSummary: SummaryFetcher) => {
  const { auth, from, headers, rangeName, selectedOrgId, to } = context
  const timespan = apiTimespanFromTo(from, to)
  const summaryResponse = timespan
    ? await fetchSummary(selectedOrgId, timespan, { headers })
    : undefined
  const summary = summaryResponse?.data ?? EMPTY_BOOKING_SUMMARY

  return data(
    {
      bookingSummary: getBookingSummaryFromApi(summary),
      distinctProjects: summary.distinctProjects,
      distinctUsers: summary.distinctUsers,
      from,
      rangeName,
      selectedOrgId,
      to,
    },
    { headers: statsResponseHeaders(auth) },
  )
}
