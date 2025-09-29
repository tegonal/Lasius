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

import { BarChartGroupMode } from 'components/ui/charts/barsHours'
import { StatsTile } from 'components/ui/charts/statsTile'
import { DataFetchEmpty } from 'components/ui/data-display/fetchState/dataFetchEmpty'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { useGetOrganisationStatsBySourceAndDay } from 'lib/api/hooks/useGetOrganisationStatsBySourceAndDay'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import dynamic from 'next/dynamic'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { OrganisationBookingSource } from 'types/booking'

type Props = {
  source: OrganisationBookingSource
  groupMode: BarChartGroupMode
}

const BarsHours = dynamic(() => import('../../../../components/ui/charts/barsHours'), {
  ssr: false,
})

export const StatsBarsBySource: React.FC<Props> = ({ source, groupMode }) => {
  const { selectedOrganisationId } = useOrganisation()
  const parentFormContext = useFormContext()

  const datespan = apiDatespanFromTo(parentFormContext.watch('from'), parentFormContext.watch('to'))
  const { data, isValidating } = useGetOrganisationStatsBySourceAndDay(selectedOrganisationId, {
    source,
    from: datespan?.from || '',
    to: datespan?.to || '',
  })

  if (isValidating) {
    return (
      <StatsTile style={{ height: 240 }}>
        <Loading />
      </StatsTile>
    )
  }

  if (!data) {
    return (
      <StatsTile style={{ height: 240 }}>
        <DataFetchEmpty />
      </StatsTile>
    )
  }

  return (
    <StatsTile style={{ height: 240 }}>
      <BarsHours stats={data} indexBy="category" groupMode={groupMode} />
    </StatsTile>
  )
}
