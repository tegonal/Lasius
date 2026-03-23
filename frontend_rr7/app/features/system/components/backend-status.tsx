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

import { ServerIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useIsClient } from '~/lib/hooks/use-is-client'

type BackendConnectionStatus = 'connected' | 'connecting' | 'disconnected'

const POLL_INTERVAL_MS = 30000

const statusDotClass: Record<BackendConnectionStatus, string> = {
  connected: 'bg-success',
  connecting: 'bg-warning',
  disconnected: 'bg-error',
}

export const BackendStatus = () => {
  const { t } = useTranslation('common')
  const isClient = useIsClient()
  const [status, setStatus] = useState<BackendConnectionStatus>('connecting')
  const intervalRef = useRef<null | ReturnType<typeof setInterval>>(null)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/session-status')
      setStatus(res.ok ? 'connected' : 'disconnected')
    } catch {
      setStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    void checkStatus()
    intervalRef.current = setInterval(
      () => void checkStatus(),
      POLL_INTERVAL_MS,
    )
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkStatus])

  if (!isClient) return null

  const labels: Record<BackendConnectionStatus, string> = {
    connected: t('system.connectedToBackend', {
      defaultValue: 'Connected to backend',
    }),
    connecting: t('system.connectingToBackend', {
      defaultValue: 'Connecting to backend',
    }),
    disconnected: t('system.backendUnreachable', {
      defaultValue: 'Backend seems to be unreachable',
    }),
  }

  return (
    <div
      className="tooltip tooltip-top"
      data-testid="backend-status"
      data-tip={labels[status]}
    >
      <div className="relative inline-flex">
        <LucideIcon icon={ServerIcon} size={14} />
        <span
          className={`absolute -top-1 -right-1 size-2 rounded-full ${statusDotClass[status]}`}
        />
      </div>
    </div>
  )
}
