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
  getConnectivityStatusLabel,
  getConnectivityStatusStyle,
} from '~/features/integrations/lib/connectivity-status'
import { untyped } from '~/lib/i18n-types'
import { cn } from '~/lib/utils/cn'
import { type ModelsConnectivityStatus } from '~/services/api/lasius'

type Properties = {
  size?: 'md' | 'sm'
  status: ModelsConnectivityStatus
}

export const HealthIndicator = ({ size = 'sm', status }: Properties) => {
  const { t } = useTranslation('integrations')

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'

  return (
    <div className="tooltip" data-tip={getConnectivityStatusLabel(status, untyped(t))}>
      <div
        className={cn(dotSize, getConnectivityStatusStyle(status).dotClassName, 'rounded-full')}
      />
    </div>
  )
}
