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

import { useLasiusApiStatus } from 'components/features/system/hooks/useLasiusApiStatus'
import { DotGreen } from 'components/ui/data-display/dots/dotGreen'
import { DotOrange } from 'components/ui/data-display/dots/dotOrange'
import { DotRed } from 'components/ui/data-display/dots/dotRed'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { useTranslation } from 'next-i18next'
import { CONNECTION_STATUS } from 'projectConfig/constants'
import React from 'react'

export const LasiusBackendStatus: React.FC = () => {
  const { t } = useTranslation('common')
  const { status } = useLasiusApiStatus()

  return (
    <div>
      {status === CONNECTION_STATUS.CONNECTED && (
        <ToolTip
          toolTipContent={t('system.connectedToBackend', { defaultValue: 'Connected to backend' })}>
          <DotGreen />
        </ToolTip>
      )}
      {status === CONNECTION_STATUS.CONNECTING && (
        <ToolTip
          toolTipContent={t('system.connectingToBackend', {
            defaultValue: 'Connecting to backend',
          })}>
          <DotOrange />
        </ToolTip>
      )}
      {(status === CONNECTION_STATUS.ERROR || status === CONNECTION_STATUS.DISCONNECTED) && (
        <ToolTip
          toolTipContent={t('system.backendUnreachable', {
            defaultValue: 'Backend seems to be unreachable',
          })}>
          <DotRed />
        </ToolTip>
      )}
    </div>
  )
}
