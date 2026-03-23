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

import { useTranslation } from 'react-i18next'
import {
  data,
  href,
  Outlet,
  type ShouldRevalidateFunctionArgs,
} from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { StatsExport } from '~/features/stats/components/stats-export'
import { StatsFilter } from '~/features/stats/components/stats-filter'
import { StatsOverview } from '~/features/stats/components/stats-overview'
import { StatsTabs } from '~/features/stats/components/stats-tabs'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { dateOptions } from '~/lib/utils/date/date-options'
import { apiTimespanFromTo } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { getOrganisationBookingList } from '~/services/api/lasius/organisation-bookings/organisation-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/organisation.stats'

// ─── Revalidation ────────────────────────────────────────────────────────────

/** Only revalidate when date range search params change */
export const shouldRevalidate = ({
  currentUrl,
  defaultShouldRevalidate,
  formMethod,
  nextUrl,
}: ShouldRevalidateFunctionArgs) => {
  if (formMethod) return defaultShouldRevalidate
  const currentFrom = currentUrl.searchParams.get('from')
  const currentTo = currentUrl.searchParams.get('to')
  const currentDateRange = currentUrl.searchParams.get('dateRange')
  const nextFrom = nextUrl.searchParams.get('from')
  const nextTo = nextUrl.searchParams.get('to')
  const nextDateRange = nextUrl.searchParams.get('dateRange')
  if (
    currentFrom === nextFrom &&
    currentTo === nextTo &&
    currentDateRange === nextDateRange
  ) {
    return false
  }
  return defaultShouldRevalidate
}

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async ({
  request,
  serverLoader,
}: Route.ClientLoaderArgs) => cachedServerLoader(request, serverLoader)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
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

  // Check admin role
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const isAdmin =
    selectedOrg?.role === ModelsUserOrganisationRole.OrganisationAdministrator

  if (!isAdmin) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Read date range from URL search params or compute defaults
  const url = new URL(request.url)
  let from = url.searchParams.get('from')
  let to = url.searchParams.get('to')

  if (!from || !to) {
    const defaultRange = dateOptions[0]?.dateRangeFn(new Date())
    from = defaultRange?.from ?? ''
    to = defaultRange?.to ?? ''
  }

  // Compute API params
  const timespan = apiTimespanFromTo(from, to)

  // Fetch bookings for overview summary
  const bookingsRes = timespan
    ? await getOrganisationBookingList(selectedOrgId, timespan, { headers })
    : { data: [] }

  const bookings = bookingsRes.data ?? []

  // Transform data server-side
  const bookingSummary = getModelsBookingSummary(bookings)

  const distinctUsers = new Set(
    bookings.map((b) => b.userReference?.id).filter(Boolean),
  ).size
  const distinctProjects = new Set(
    bookings.map((b) => b.projectReference?.id).filter(Boolean),
  ).size

  return data(
    {
      bookingSummary,
      distinctProjects,
      distinctUsers,
      from,
      selectedOrgId,
      to,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const OrgStatsLayout = ({ loaderData }: Route.ComponentProps) => {
  const { t } = useTranslation('common')

  const {
    bookingSummary,
    distinctProjects,
    distinctUsers,
    from,
    selectedOrgId,
    to,
  } = loaderData

  const tabs = [
    {
      id: 'projects',
      label: t('projects.title', { defaultValue: 'Projects' }),
      to: href('/organisation/stats/projects'),
    },
    {
      id: 'users',
      label: t('members.title', { defaultValue: 'Members' }),
      to: href('/organisation/stats/users'),
    },
    {
      id: 'tags',
      label: t('tags.title', { defaultValue: 'Tags' }),
      to: href('/organisation/stats/tags'),
    },
  ]

  return (
    <div className={innerGridClasses} data-testid="org-stats-page">
      <ColumnCenter>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="bg-base-200 flex-shrink-0 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <StatsOverview
                  distinctProjects={distinctProjects}
                  distinctUsers={distinctUsers}
                  elements={bookingSummary.elements}
                  hours={bookingSummary.hours}
                />
              </div>
              <div className="flex-shrink-0">
                <StatsExport
                  bookingList={bookingSummary}
                  distinctProjects={distinctProjects}
                  distinctUsers={distinctUsers}
                  from={from}
                  scope="organisation"
                  selectedOrgId={selectedOrgId}
                  to={to}
                />
              </div>
            </div>
          </div>
          <div className="border-base-200 border-b px-6 pt-2">
            <StatsTabs tabs={tabs} />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="pt-4">
              <Outlet />
            </div>
          </ScrollArea>
        </div>
      </ColumnCenter>
      <ColumnRight>
        <ScrollArea className="h-full">
          <div className="p-4">
            <StatsFilter />
          </div>
        </ScrollArea>
      </ColumnRight>
    </div>
  )
}

export default OrgStatsLayout
