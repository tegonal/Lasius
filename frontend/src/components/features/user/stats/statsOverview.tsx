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

import { statsSwrConfig } from 'components/ui/data-display/stats/statsSwrConfig'
import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileHours } from 'components/ui/data-display/StatsTileHours'
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

  const timespan = apiTimespanFromTo(parentFormContext.watch('from'), parentFormContext.watch('to'))

  const { data, isValidating } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    timespan || { from: '', to: '' },
    statsSwrConfig,
  )

  const summary = useMemo(
    () => (data && !isValidating ? getModelsBookingSummary(data) : undefined),
    [data, isValidating],
  )

  // Calculate distinct users and projects
  const distinctUsers = useMemo(() => {
    if (!data || isValidating) return 0
    const users = new Set(data.map((item) => item.userReference?.key).filter(Boolean))
    return users.size
  }, [data, isValidating])

  const distinctProjects = useMemo(() => {
    if (!data || isValidating) return 0
    const projects = new Set(data.map((item) => item.projectReference?.key).filter(Boolean))
    return projects.size
  }, [data, isValidating])

  // Hide overview if no data
  const hasData = !isValidating && data && data.length > 0

  if (!hasData) {
    return null
  }

  return (
    <StatsGroup className="flex gap-4">
      <StatsTileHours
        value={summary?.hours || 0}
        label={t('common.units.hours', { defaultValue: 'Hours' })}
        standalone={false}
      />
      <StatsTileNumber
        value={summary?.elements || 0}
        label={t('bookings.title', { defaultValue: 'Bookings' })}
        standalone={false}
      />
      {distinctUsers > 1 && (
        <StatsTileNumber
          value={distinctUsers}
          label={t('users.title', { defaultValue: 'Users' })}
          standalone={false}
        />
      )}
      {distinctProjects > 1 && (
        <StatsTileNumber
          value={distinctProjects}
          label={t('projects.title', { defaultValue: 'Projects' })}
          standalone={false}
        />
      )}
    </StatsGroup>
  )
}
