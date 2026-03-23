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
import { Modal } from '~/components/ui/overlays/modal/modal'
import { useBackendStatus, useVersionDrift } from '~/stores/ui-store'

import { useHealthMonitor } from '../hooks/use-health-monitor'

/**
 * Monitors backend connectivity and app version drift.
 * Starts the health poll loop and shows modals when issues are detected.
 * The poll writes to the UI store — footer indicators read from the same store.
 */
export const HealthMonitor = () => {
  const { t } = useTranslation('common')

  // Start the polling loop (writes to UI store)
  useHealthMonitor()

  // Read state from store
  const backendStatus = useBackendStatus()
  const versionDrift = useVersionDrift()
  const backendOffline = backendStatus === 'disconnected'

  return (
    <>
      {/* Backend offline — blocking, dismissible */}
      <Modal
        blockViewport
        onClose={() => {
          /* dismissible via backdrop — will reappear on next poll if still offline */
        }}
        open={backendOffline}
      >
        <div>
          {t('system.offlineMessage', {
            defaultValue:
              'Lasius is currently offline or undergoing maintenance. We will be back shortly.',
          })}
        </div>
      </Modal>

      {/* Version drift — confirm to reload */}
      {versionDrift && (
        <GenericConfirmModal
          blockViewport
          cancelLabel={t('common.actions.cancel', { defaultValue: 'Cancel' })}
          confirmLabel={t('pwa.reloadApplication', {
            defaultValue: 'Reload application',
          })}
          confirmVariant="primary"
          message={t('pwa.updateMessage', {
            defaultValue:
              'Lasius has been updated. The page will reload after your confirmation.',
          })}
          onClose={() => {
            /* user dismissed — will not nag again until next version change */
          }}
          onConfirm={() => window.location.reload()}
          open={versionDrift}
          title={t('pwa.updateAvailable', { defaultValue: 'Update available' })}
        />
      )}
    </>
  )
}
