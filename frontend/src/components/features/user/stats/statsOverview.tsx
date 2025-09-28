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

import { Heading } from 'components/primitives/typography/Heading'
import { statsSwrConfig } from 'components/ui/data-display/stats/statsSwrConfig'
import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

export const StatsOverview: React.FC = () => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const parentFormContext = useFormContext()

  const { data, isValidating } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    {
      ...apiTimespanFromTo(parentFormContext.watch('from'), parentFormContext.watch('to')),
    },
    statsSwrConfig,
  )

  const summary = useMemo(
    () => (data && !isValidating ? getModelsBookingSummary(data) : undefined),
    [data, isValidating],
  )

  return (
    <div className="w-full">
      <Heading variant="section">{t('ui.summary', { defaultValue: 'Summary' })}</Heading>
      <StatsGroup className="w-full pb-4">
        <StatsTileNumber
          value={summary?.hours || 0}
          label={t('common.time.hours', { defaultValue: 'Hours' })}
          standalone={false}
        />
        <StatsTileNumber
          value={summary?.elements || 0}
          label={t('bookings.title', { defaultValue: 'Bookings' })}
          standalone={false}
        />
      </StatsGroup>
    </div>
  )
}
