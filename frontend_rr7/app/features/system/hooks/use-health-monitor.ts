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

import { logger } from '~/lib/logger'
import { type HealthResponse } from '~/routes/api.health'
import { useUIStore } from '~/stores/ui-store'

const POLL_INTERVAL_MS = 10_000
const STATUS_DEBOUNCE_MS = 2_000

/**
 * Polls /api/health every 10s (pauses when tab is unfocused).
 * Writes backend status and version drift to the UI store.
 * Mount once in app-layout — consumers read from the store via selectors.
 */
export const useHealthMonitor = () => {
  const initialVersionRef = useRef<null | string>(null)
  const debounceRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const intervalRef = useRef<null | ReturnType<typeof setInterval>>(null)

  const scheduleDebouncedOffline = useCallback((offline: boolean) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      useUIStore
        .getState()
        .setBackendStatus(offline ? 'disconnected' : 'connected')
    }, STATUS_DEBOUNCE_MS)
  }, [])

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/health')

      if (!res.ok) {
        logger.warn('[HealthMonitor] Health check request failed', res.status)
        useUIStore.getState().setBackendStatus('disconnected')
        scheduleDebouncedOffline(true)
        return
      }

      const health: HealthResponse = await res.json()

      // Backend connectivity — immediate for indicator, debounced for modal
      const isDisconnected = health.backend === 'disconnected'
      useUIStore
        .getState()
        .setBackendStatus(isDisconnected ? 'disconnected' : 'connected')
      scheduleDebouncedOffline(isDisconnected)

      // Version drift detection
      if (health.version && health.version !== 'dev') {
        if (initialVersionRef.current === null) {
          initialVersionRef.current = health.version
        } else if (health.version !== initialVersionRef.current) {
          logger.info('[HealthMonitor] Version drift detected', {
            client: initialVersionRef.current,
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

    const handleFocus = () => {
      void poll()
      intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)
    }

    const handleBlur = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [poll])
}
