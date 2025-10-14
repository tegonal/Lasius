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

import { useTranslation } from 'next-i18next'
import React from 'react'

import type { ModelsConnectivityStatus } from 'lib/api/lasius'

type Props = {
  status: ModelsConnectivityStatus
  size?: 'sm' | 'md'
}

export const HealthIndicator: React.FC<Props> = ({ status, size = 'sm' }) => {
  const { t } = useTranslation('integrations')

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-success'
      case 'degraded':
        return 'bg-warning'
      case 'failed':
        return 'bg-error'
      case 'unknown':
        return 'bg-base-content/30'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'healthy':
        return t('issueImporters.healthStatus.healthy', { defaultValue: 'Healthy' })
      case 'degraded':
        return t('issueImporters.healthStatus.degraded', { defaultValue: 'Degraded' })
      case 'failed':
        return t('issueImporters.healthStatus.failed', { defaultValue: 'Failed' })
      case 'unknown':
        return t('issueImporters.healthStatus.unknown', { defaultValue: 'Unknown' })
    }
  }

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'

  return (
    <div className="tooltip" data-tip={getStatusLabel()}>
      <div className={`${dotSize} ${getStatusColor()} rounded-full`} />
    </div>
  )
}
