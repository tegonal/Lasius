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

import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import {
  data,
  Outlet,
  type ShouldRevalidateFunctionArgs,
  useSearchParams,
} from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { CalendarDataProvider } from '~/features/calendar/calendar-data-provider'
import { CalendarMonthCompact } from '~/features/dashboard/components/calendar-month-compact'
import { DashboardTabs } from '~/features/dashboard/components/dashboard-tabs'
import { WorkloadIndicator } from '~/features/dashboard/components/workload-indicator'
import { computeWorkHealthMetrics } from '~/lib/api/functions/compute-work-health-metrics.server'
import { getWeeklyPlannedHours } from '~/lib/api/functions/get-planned-working-hours'
import { formatDateTimeToURLParam, formatISOLocale } from '~/lib/utils/dates'
import { getUserBookingListByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/dashboard'

// ─── Revalidation ────────────────────────────────────────────────────────────

/** Only revalidate when the date search param changes, not on child tab switches */
export const shouldRevalidate = ({
  currentUrl,
  defaultShouldRevalidate,
  formMethod,
  nextUrl,
}: ShouldRevalidateFunctionArgs) => {
  if (formMethod) return defaultShouldRevalidate
  const currentDate = currentUrl.searchParams.get('date')
  const nextDate = nextUrl.searchParams.get('date')
  if (currentDate === nextDate) return false
  return defaultShouldRevalidate
}

const WEEKS_TO_ANALYZE = 12

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const profile = await getUserProfile({ headers })
  const user = profile.data

  // Determine selected org: settings > private org > first org
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
  const weeklyPlannedHours = getWeeklyPlannedHours(plannedHours)

  // Read selected date from search params (default to today)
  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const selectedDate =
    dateParam && !Number.isNaN(new Date(dateParam).getTime())
      ? dateParam
      : formatISOLocale(new Date())

  // Fetch 12-week booking data for burnout metrics
  const refDate = new Date(selectedDate)
  const from = formatDateTimeToURLParam(
    startOfWeek(subWeeks(refDate, WEEKS_TO_ANALYZE - 1), {
      weekStartsOn: 1,
    }),
  )
  const to = formatDateTimeToURLParam(endOfWeek(refDate, { weekStartsOn: 1 }))

  const bookingsResponse = await getUserBookingListByOrganisation(
    selectedOrgId,
    { from, to },
    { headers },
  )

  // Compute burnout metrics server-side
  const { burnoutMetrics, weeklyData } = computeWorkHealthMetrics(
    bookingsResponse.data,
    weeklyPlannedHours,
    WEEKS_TO_ANALYZE,
    selectedDate,
  )

  return data(
    {
      burnoutMetrics,
      plannedHours,
      selectedDate,
      selectedOrgId,
      weeklyData,
      weeklyPlannedHours,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

const DashboardLayout = ({ loaderData }: Route.ComponentProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const date =
    dateParam && !Number.isNaN(new Date(dateParam).getTime())
      ? dateParam
      : loaderData.selectedDate

  const handleDateChange = (newDate: string) => {
    const safe = format(new Date(newDate), 'yyyy-MM-dd')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('date', safe)
      return next
    })
  }

  return (
    <div className={innerGridClasses}>
      <ColumnCenter>
        <div className="border-base-200 border-b px-4 pt-2">
          <DashboardTabs />
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </ColumnCenter>
      <ColumnRight>
        <div className="p-4">
          <CalendarDataProvider
            date={date}
            organisationId={loaderData.selectedOrgId}
            period="month"
          >
            <CalendarMonthCompact date={date} onDateChange={handleDateChange} />
          </CalendarDataProvider>
          <div className="border-base-content/10 my-4 border-t" />
          <WorkloadIndicator
            burnoutMetrics={loaderData.burnoutMetrics}
            plannedWeeklyHours={loaderData.weeklyPlannedHours}
          />
        </div>
      </ColumnRight>
    </div>
  )
}

export default DashboardLayout
