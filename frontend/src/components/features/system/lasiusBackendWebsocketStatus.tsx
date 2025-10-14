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

import { DotGreen } from 'components/ui/data-display/dots/dotGreen'
import { DotOrange } from 'components/ui/data-display/dots/dotOrange'
import { DotRed } from 'components/ui/data-display/dots/dotRed'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { useLasiusWebsocket } from 'lib/api/hooks/useLasiusWebsocket'
import { logger } from 'lib/logger'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { CONNECTION_STATUS } from 'projectConfig/constants'
import React, { useEffect } from 'react'
import { useInterval, useIsClient } from 'usehooks-ts'

export const LasiusBackendWebsocketStatus: React.FC = () => {
  const { t } = useTranslation('common')
  const { connectionStatus, sendJsonMessage } = useLasiusWebsocket()
  const [status, setStatus] = React.useState<CONNECTION_STATUS>(CONNECTION_STATUS.DISCONNECTED)
  const isClient = useIsClient()
  const session = useSession()

  useEffect(() => {
    logger.info('[AppWebsocketStatus]', connectionStatus)

    const sendClientAuthentication = () => {
      sendJsonMessage(
        {
          type: 'HelloServer',
          client: 'lasius-nextjs-frontend',
          token: session.data?.access_token,
          tokenIssuer: session.data?.access_token_issuer,
        },
        false,
      )
    }

    if (connectionStatus === CONNECTION_STATUS.CONNECTED && session.data?.access_token) {
      logger.info('[useLasiusWebsocket][connectionStatus][sendHelloServerAndAuthenticate')
      sendClientAuthentication()
    }

    setStatus(connectionStatus)
  }, [
    connectionStatus,
    session.data?.access_token,
    session.data?.access_token_issuer,
    sendJsonMessage,
  ])

  //  In an effort to keep the websocket connection alive, we send a ping message every 5 seconds
  useInterval(() => {
    if (connectionStatus === CONNECTION_STATUS.CONNECTED) {
      sendJsonMessage({ type: 'Ping' }, false)
    }
  }, 5000)

  if (!isClient) return null

  return (
    <div>
      {status === CONNECTION_STATUS.CONNECTED && (
        <ToolTip
          toolTipContent={t('websocket.status.connected', { defaultValue: 'Websocket connected' })}>
          <DotGreen />
        </ToolTip>
      )}
      {status === CONNECTION_STATUS.CONNECTING && (
        <ToolTip
          toolTipContent={t('websocket.status.connecting', {
            defaultValue: 'Websocket connecting',
          })}>
          <DotOrange />
        </ToolTip>
      )}
      {status === CONNECTION_STATUS.ERROR && (
        <ToolTip
          toolTipContent={t('websocket.status.error', {
            defaultValue: 'Unable to connect to websocket',
          })}>
          <DotRed />
        </ToolTip>
      )}
      {status === CONNECTION_STATUS.DISCONNECTED && (
        <ToolTip
          toolTipContent={t('websocket.status.error', {
            defaultValue: 'Unable to connect to websocket',
          })}>
          <DotRed />
        </ToolTip>
      )}
    </div>
  )
}
