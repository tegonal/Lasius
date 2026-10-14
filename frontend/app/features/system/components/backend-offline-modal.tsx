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

import { CloudOff, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'

import { secondsUntil } from '../hooks/use-health-monitor'

type BackendOfflineModalProperties = {
  isManualCheck: boolean
  nextCheckAt: null | number
  onRetry: () => void
  open: boolean
}

const keepOpen = () => {}

/** Blocks the app while the backend is offline, and closes by itself after a successful check. */
export const BackendOfflineModal = ({
  isManualCheck,
  nextCheckAt,
  onRetry,
  open,
}: BackendOfflineModalProperties) => {
  const { t } = useTranslation('system')
  const retryReference = useRef<HTMLButtonElement>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!open) return
    // The first tick runs at once, because the stored time can be from the app start.
    const first = setTimeout(() => setNow(Date.now()), 0)
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [open])

  const seconds = nextCheckAt === null ? 0 : secondsUntil(nextCheckAt, now)
  const isChecking = isManualCheck || seconds === 0

  return (
    <Modal blockViewport initialFocus={retryReference} onClose={keepOpen} open={open}>
      <div className="flex flex-col items-center gap-4 text-center" data-testid="backend-offline">
        <div className="bg-warning/15 text-warning flex h-16 w-16 items-center justify-center rounded-full">
          <LucideIcon icon={CloudOff} size={32} />
        </div>
        <h2 className="text-xl font-semibold">
          {t('system:offline.title', 'Lasius is not reachable')}
        </h2>
        <p className="text-base-content/80">
          {t(
            'system:offlineMessage',
            'Lasius is currently offline or undergoing maintenance. We will be back shortly.',
          )}
        </p>
        <p aria-live="polite" className="text-base-content/60 text-sm">
          {isChecking
            ? t('system:offline.checking', 'Checking the connection…')
            : t('system:offline.nextCheck', 'Next check in {{count}} seconds', {
                count: seconds,
                defaultValue_one: 'Next check in {{count}} second',
                defaultValue_other: 'Next check in {{count}} seconds',
              })}
        </p>
        <Button
          data-testid="backend-offline-retry-btn"
          fullWidth={false}
          loading={isManualCheck}
          onClick={onRetry}
          ref={retryReference}
          variant="primary">
          <LucideIcon icon={RefreshCw} size={16} />
          {t('system:offline.retryNow', 'Try again now')}
        </Button>
      </div>
    </Modal>
  )
}
