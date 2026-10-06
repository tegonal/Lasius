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

import { AlertCircle, CheckCircle2, Clock, type LucideIcon, XCircle } from 'lucide-react'

import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { type ModelsConnectivityStatus } from '~/services/api/lasius'

type ConnectivityStatusStyle = {
  dotClassName: string
  icon: LucideIcon
  iconClassName: string
}

const STATUS_STYLES: Record<ModelsConnectivityStatus, ConnectivityStatusStyle> = {
  degraded: { dotClassName: 'bg-warning', icon: AlertCircle, iconClassName: 'text-warning' },
  failed: { dotClassName: 'bg-error', icon: XCircle, iconClassName: 'text-error' },
  healthy: { dotClassName: 'bg-success', icon: CheckCircle2, iconClassName: 'text-success' },
  unknown: {
    dotClassName: 'bg-base-content/30',
    icon: Clock,
    iconClassName: 'text-base-content/50',
  },
}

export const getConnectivityStatusStyle = (
  status: ModelsConnectivityStatus,
): ConnectivityStatusStyle => STATUS_STYLES[status] ?? STATUS_STYLES.unknown

export const getConnectivityStatusLabel = (
  status: ModelsConnectivityStatus,
  t: SchemaTranslationFunction,
): string => {
  switch (status) {
    case 'degraded': {
      return t('integrations:issueImporters.healthStatus.degraded', { defaultValue: 'Degraded' })
    }
    case 'failed': {
      return t('integrations:issueImporters.healthStatus.failed', { defaultValue: 'Failed' })
    }
    case 'healthy': {
      return t('integrations:issueImporters.healthStatus.healthy', { defaultValue: 'Healthy' })
    }
    case 'unknown': {
      return t('integrations:issueImporters.healthStatus.unknown', { defaultValue: 'Unknown' })
    }
  }
}
