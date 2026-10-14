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

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  API_ROUTES,
  HEALTH_POLL_INTERVAL_MS,
  HEALTH_RETRY_BASE_MS,
  HEALTH_RETRY_MAX_MS,
  HEALTH_STATUS_DEBOUNCE_MS,
} from '~/config/constants'
import { logger } from '~/lib/logger'
import { type HealthResponse } from '~/routes/api.health'
import { useUIStore } from '~/stores/ui-store'

export const toBackendStatus = (isOffline: boolean) =>
  isOffline ? ('disconnected' as const) : ('connected' as const)

/**
 * The first real server version becomes the client version. A later different version is a drift.
 * A missing version and the version `dev` change nothing.
 */
export const checkVersion = (initialVersion: null | string, version: string | undefined) => {
  if (!version || version === 'dev') return { initialVersion, isDrift: false }
  if (initialVersion === null) return { initialVersion: version, isDrift: false }
  return { initialVersion, isDrift: version !== initialVersion }
}

/** The delay before the next health check after `failures` failed checks in a row. */
export const getRetryDelay = (failures: number) => {
  if (failures <= 0) return HEALTH_POLL_INTERVAL_MS
  return Math.min(HEALTH_RETRY_BASE_MS * 2 ** (failures - 1), HEALTH_RETRY_MAX_MS)
}

/** The whole seconds from `now` to `target`, never below 0. */
export const secondsUntil = (target: number, now: number) =>
  Math.max(0, Math.ceil((target - now) / 1000))

type HealthCheckResult = { isOffline: boolean; version?: string }

// A request that never returns would block every later check. The server probe gives up after 3 s.
const HEALTH_REQUEST_TIMEOUT_MS = 5000

const checkHealth = async (): Promise<HealthCheckResult> => {
  try {
    const response = await fetch(API_ROUTES.HEALTH, {
      signal: AbortSignal.timeout(HEALTH_REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) {
      logger.warn('[HealthMonitor] Health check request failed', response.status)
      return { isOffline: true }
    }
    const health: HealthResponse = await response.json()
    return { isOffline: health.backend === 'disconnected', version: health.version }
  } catch {
    logger.warn('[HealthMonitor] Health check network error')
    return { isOffline: true }
  }
}

/**
 * Checks /api/health every 10 s while the tab is visible. After a failed check it retries with an
 * exponential backoff. Writes the backend status and a version drift to the UI store.
 * Mount once in app-layout. The returned values drive the offline overlay.
 */
export const useHealthMonitor = () => {
  const initialVersionReference = useRef<null | string>(null)
  const debounceReference = useRef<null | ReturnType<typeof setTimeout>>(null)
  const timeoutReference = useRef<null | ReturnType<typeof setTimeout>>(null)
  const failuresReference = useRef(0)
  const isCheckingReference = useRef(false)
  const isDisposedReference = useRef(false)
  // The scheduled check reads poll through this ref, because poll cannot name itself.
  const pollReference = useRef<() => Promise<void>>(() => Promise.resolve())
  const [nextCheckAt, setNextCheckAt] = useState<null | number>(null)
  const [isManualCheck, setIsManualCheck] = useState(false)

  const scheduleDebouncedOffline = useCallback((isOffline: boolean) => {
    if (debounceReference.current) {
      clearTimeout(debounceReference.current)
    }
    debounceReference.current = setTimeout(() => {
      useUIStore.getState().setBackendStatus(toBackendStatus(isOffline))
    }, HEALTH_STATUS_DEBOUNCE_MS)
  }, [])

  const clearScheduledCheck = useCallback(() => {
    if (!timeoutReference.current) return
    clearTimeout(timeoutReference.current)
    timeoutReference.current = null
  }, [])

  const poll = useCallback(async () => {
    if (isCheckingReference.current) return
    isCheckingReference.current = true
    clearScheduledCheck()

    const result = await checkHealth()
    isCheckingReference.current = false
    // The monitor can unmount during the request, for example on a redirect to the login page.
    if (isDisposedReference.current) return

    useUIStore.getState().setBackendStatus(toBackendStatus(result.isOffline))
    scheduleDebouncedOffline(result.isOffline)

    const versionCheck = checkVersion(initialVersionReference.current, result.version)
    initialVersionReference.current = versionCheck.initialVersion
    if (versionCheck.isDrift) {
      logger.info('[HealthMonitor] Version drift detected', {
        client: versionCheck.initialVersion,
        server: result.version,
      })
      useUIStore.getState().setVersionDrift(true)
    }

    failuresReference.current = result.isOffline ? failuresReference.current + 1 : 0
    setIsManualCheck(false)

    // A hidden tab checks again when it becomes visible.
    if (document.hidden) {
      setNextCheckAt(null)
      return
    }
    const delay = getRetryDelay(failuresReference.current)
    setNextCheckAt(result.isOffline ? Date.now() + delay : null)
    timeoutReference.current = setTimeout(() => void pollReference.current(), delay)
  }, [clearScheduledCheck, scheduleDebouncedOffline])

  useEffect(() => {
    pollReference.current = poll
  }, [poll])

  const retryNow = useCallback(() => {
    setIsManualCheck(true)
    void poll()
  }, [poll])

  useEffect(() => {
    isDisposedReference.current = false
    timeoutReference.current = setTimeout(() => void pollReference.current(), 0)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearScheduledCheck()
        return
      }
      void poll()
    }
    const handleWake = () => void poll()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWake)
    window.addEventListener('online', handleWake)

    return () => {
      isDisposedReference.current = true
      clearScheduledCheck()
      if (debounceReference.current) clearTimeout(debounceReference.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWake)
      window.removeEventListener('online', handleWake)
    }
  }, [clearScheduledCheck, poll])

  return { isManualCheck, nextCheckAt, retryNow }
}
