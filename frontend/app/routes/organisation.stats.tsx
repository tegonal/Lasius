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
import { href } from 'react-router'

import { StatsOverviewLayout } from '~/features/stats/components/stats-overview-layout'
import { loadOrgStatsContext } from '~/features/stats/stats-loader.server'
import { loadStatsOverview } from '~/features/stats/stats-overview-loader.server'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { getOrganisationBookingSummary } from '~/services/api/lasius/organisation-bookings/organisation-bookings'

import { type Route } from './+types/organisation.stats'

export const clientLoader = ({ request, serverLoader }: Route.ClientLoaderArgs) =>
  cachedServerLoader('routes/organisation.stats', request, serverLoader)
clientLoader.hydrate = false

export const loader = async ({ request, url }: Route.LoaderArgs) =>
  loadStatsOverview(await loadOrgStatsContext(request, url), getOrganisationBookingSummary)

const OrgStatsLayout = ({ loaderData }: Route.ComponentProps) => {
  const { t } = useTranslation('organisation')

  const tabs = [
    {
      id: 'projects',
      label: t('projects:title', 'Projects'),
      to: href('/organisation/stats/projects'),
    },
    {
      id: 'users',
      label: t('members.title', 'Members'),
      to: href('/organisation/stats/users'),
    },
    {
      id: 'tags',
      label: t('tag-manager:title', 'Tags'),
      to: href('/organisation/stats/tags'),
    },
  ]

  return (
    <StatsOverviewLayout {...loaderData} scope="organisation" tabs={tabs} testId="org-stats-page" />
  )
}

export default OrgStatsLayout

export { statsShouldRevalidate as shouldRevalidate } from '~/features/stats/stats-loader'
