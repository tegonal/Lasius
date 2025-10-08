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

import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { logger } from 'lib/logger'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useUIStore } from 'stores/uiStore'

export const BootstrapTasks: React.FC = () => {
  const { events } = useRouter()
  const { handleCloseAll } = useContextMenu()
  const showGlobalLoading = useUIStore((state) => state.showGlobalLoading)
  const hideGlobalLoading = useUIStore((state) => state.hideGlobalLoading)

  const handleRouteChangeStart = () => {
    logger.info('[BootstrapTasks][onRouteChangeStart]')
    showGlobalLoading()
  }

  const handleRouteChangeComplete = (newRoute: any) => {
    logger.info('[BootstrapTasks][onRouteChangeComplete]', { newRoute })
    hideGlobalLoading()
    handleCloseAll()
  }

  const handleRouteChangeError = (errorRoute: string) => {
    logger.error('[BootstrapTasks][onRouteChangeError]', errorRoute)
    hideGlobalLoading()
  }

  const handleBeforeHistoryChange = (url: string) => {
    // This fires when user cancels navigation (e.g., back button then forward)
    logger.info('[BootstrapTasks][beforeHistoryChange]', { url })
    // Reset loading state in case route change was cancelled
    const currentCounter = useUIStore.getState().globalLoadingCounter
    if (currentCounter > 0) {
      logger.warn('[BootstrapTasks] Route may have been cancelled, resetting loading state', {
        counter: currentCounter,
      })
      useUIStore.getState().setGlobalLoading(false)
    }
  }

  useEffect(() => {
    logger.info('[initializer][loadOnRefresh]')
    events.on('routeChangeStart', handleRouteChangeStart)
    events.on('routeChangeComplete', handleRouteChangeComplete)
    events.on('routeChangeError', handleRouteChangeError)
    events.on('beforeHistoryChange', handleBeforeHistoryChange)

    return () => {
      events.off('routeChangeStart', handleRouteChangeStart)
      events.off('routeChangeComplete', handleRouteChangeComplete)
      events.off('routeChangeError', handleRouteChangeError)
      events.off('beforeHistoryChange', handleBeforeHistoryChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
