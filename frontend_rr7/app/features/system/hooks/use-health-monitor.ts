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

import { useCallback, useEffect, useRef } from 'react'

import { API_ROUTES, HEALTH_POLL_INTERVAL_MS, HEALTH_STATUS_DEBOUNCE_MS } from '~/config/constants'
import { logger } from '~/lib/logger'
import { type HealthResponse } from '~/routes/api.health'
import { useUIStore } from '~/stores/ui-store'

/**
 * Polls /api/health every 10s (pauses when tab is unfocused).
 * Writes backend status and version drift to the UI store.
 * Mount once in app-layout — consumers read from the store via selectors.
 */
export const useHealthMonitor = () => {
  const initialVersionReference = useRef<null | string>(null)
  const debounceReference = useRef<null | ReturnType<typeof setTimeout>>(null)
  const intervalReference = useRef<null | ReturnType<typeof setInterval>>(null)

  const scheduleDebouncedOffline = useCallback((isOffline: boolean) => {
    if (debounceReference.current) {
      clearTimeout(debounceReference.current)
    }
    debounceReference.current = setTimeout(() => {
      useUIStore.getState().setBackendStatus(isOffline ? 'disconnected' : 'connected')
    }, HEALTH_STATUS_DEBOUNCE_MS)
  }, [])

  const poll = useCallback(async () => {
    try {
      const response = await fetch(API_ROUTES.HEALTH)

      if (!response.ok) {
        logger.warn('[HealthMonitor] Health check request failed', response.status)
        useUIStore.getState().setBackendStatus('disconnected')
        scheduleDebouncedOffline(true)
        return
      }

      const health: HealthResponse = await response.json()

      // Backend connectivity — immediate for indicator, debounced for modal
      const isDisconnected = health.backend === 'disconnected'
      useUIStore.getState().setBackendStatus(isDisconnected ? 'disconnected' : 'connected')
      scheduleDebouncedOffline(isDisconnected)

      // Version drift detection
      if (health.version && health.version !== 'dev') {
        if (initialVersionReference.current === null) {
          initialVersionReference.current = health.version
        } else if (health.version !== initialVersionReference.current) {
          logger.info('[HealthMonitor] Version drift detected', {
            client: initialVersionReference.current,
            server: health.version,
          })
          useUIStore.getState().setVersionDrift(true)
        }
      }
    } catch {
      logger.warn('[HealthMonitor] Health check network error')
      useUIStore.getState().setBackendStatus('disconnected')
      scheduleDebouncedOffline(true)
    }
  }, [scheduleDebouncedOffline])

  useEffect(() => {
    void poll()

    const startInterval = () => {
      if (intervalReference.current) clearInterval(intervalReference.current)
      intervalReference.current = setInterval(() => void poll(), HEALTH_POLL_INTERVAL_MS)
    }

    const handleFocus = () => {
      void poll()
      startInterval()
    }

    const handleBlur = () => {
      if (!intervalReference.current) {
        return
      }

      clearInterval(intervalReference.current)
      intervalReference.current = null
    }

    startInterval()

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      if (intervalReference.current) clearInterval(intervalReference.current)
      if (debounceReference.current) clearTimeout(debounceReference.current)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [poll])
}
