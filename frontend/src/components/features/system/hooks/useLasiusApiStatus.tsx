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

import { useBrowserConnectionStatus } from 'components/features/system/hooks/useBrowserConnectionStatus'
import { getConfiguration } from 'lib/api/lasius/general/general'
import { logger } from 'lib/logger'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { CONNECTION_STATUS, IS_BROWSER } from 'projectConfig/constants'
import { API_STATUS_INTERVAL } from 'projectConfig/intervals'
import React from 'react'
import { useInterval } from 'usehooks-ts'

const testApiConnection = async () => {
  try {
    await getConfiguration()
    return CONNECTION_STATUS.CONNECTED
  } catch (error) {
    logger.info(error)
    if ((error as any)?.response?.status === 401) {
      return CONNECTION_STATUS.NOT_AUTHENTICATED
    }
    return CONNECTION_STATUS.DISCONNECTED
  }
}

/**
 * Custom hook for monitoring the Lasius API connection status.
 * Periodically tests the API connection and tracks whether the backend is reachable.
 * Works in conjunction with browser connection status to distinguish between
 * network issues and API-specific problems.
 *
 * @returns Object containing:
 *   - status: Current API connection status (CONNECTED, DISCONNECTED, or NOT_AUTHENTICATED)
 *
 * @example
 * const { status } = useLasiusApiStatus()
 *
 * if (status === CONNECTION_STATUS.DISCONNECTED) {
 *   return <ApiOfflineWarning />
 * }
 *
 * @remarks
 * - Tests API connection at regular intervals (defined by API_STATUS_INTERVAL)
 * - Only tests when browser is online (relies on useBrowserConnectionStatus)
 * - Tracks analytics events when API connection is lost
 * - Distinguishes between network errors and authentication errors (401)
 */
export const useLasiusApiStatus = () => {
  const [status, setStatus] = React.useState(CONNECTION_STATUS.CONNECTED)
  const [isWindowFocused, setIsWindowFocused] = React.useState(true)
  const { status: browserStatus } = useBrowserConnectionStatus()
  const plausible = usePlausible<LasiusPlausibleEvents>()

  // Track window focus to pause polling when tab is not active
  React.useEffect(() => {
    if (!IS_BROWSER) return

    const handleFocus = () => setIsWindowFocused(true)
    const handleBlur = () => setIsWindowFocused(false)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const handleOnline = () => {
    setStatus(CONNECTION_STATUS.CONNECTED)
  }

  const handleOffline = () => {
    setStatus(CONNECTION_STATUS.DISCONNECTED)
    if (browserStatus === CONNECTION_STATUS.CONNECTED) {
      if (IS_BROWSER) {
        plausible('error.network', {
          props: {
            message: 'api_connection_lost',
          },
        })
      }
    }
  }

  // Only poll when window is focused and browser is online
  useInterval(
    async () => {
      if (browserStatus === CONNECTION_STATUS.CONNECTED && isWindowFocused) {
        const status = await testApiConnection()
        if (status === CONNECTION_STATUS.CONNECTED) handleOnline()
        if (status === CONNECTION_STATUS.DISCONNECTED) handleOffline()
      }
    },
    isWindowFocused ? API_STATUS_INTERVAL : null,
  )

  return { status }
}
