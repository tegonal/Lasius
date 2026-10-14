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

import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { useBackendStatus, useHasVersionDrift } from '~/stores/ui-store'

import { useHealthMonitor } from '../hooks/use-health-monitor'
import { BackendOfflineModal } from './backend-offline-modal'

/**
 * Monitors backend connectivity and app version drift.
 * Starts the health poll loop and shows modals when issues are detected.
 * The poll writes to the UI store — footer indicators read from the same store.
 */
export const HealthMonitor = () => {
  const { t } = useTranslation('system')

  // Start the polling loop (writes to UI store)
  const { isManualCheck, nextCheckAt, retryNow } = useHealthMonitor()

  // Read state from store
  const backendStatus = useBackendStatus()
  const isVersionDrift = useHasVersionDrift()
  const isBackendOffline = backendStatus === 'disconnected'

  return (
    <>
      <BackendOfflineModal
        isManualCheck={isManualCheck}
        nextCheckAt={nextCheckAt}
        onRetry={retryNow}
        open={isBackendOffline}
      />

      {/* Version drift — confirm to reload */}
      {isVersionDrift && (
        <GenericConfirmModal
          blockViewport
          cancelLabel={t('actions.cancel', 'Cancel')}
          confirmLabel={t('system:pwa.reloadApplication', 'Reload application')}
          confirmVariant="primary"
          message={t(
            'system:pwa.updateMessage',
            'Lasius has been updated. The page will reload after your confirmation.',
          )}
          onClose={() => {
            /* user dismissed — will not nag again until next version change */
          }}
          onConfirm={() => location.reload()}
          open={isVersionDrift}
          title={t('system:pwa.updateAvailable', 'Update available')}
        />
      )}
    </>
  )
}
