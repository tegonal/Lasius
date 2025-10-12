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

import { GenericConfirmModal } from 'components/ui/overlays/modal/GenericConfirmModal'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

const LasiusPwaUpdater: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')

  const handleConfirm = () => {
    window.workbox.messageSkipWaiting()
    setIsOpen(false)
  }

  useEffect(() => {
    const handleControlling = () => {
      window.location.reload()
    }

    const handleWaiting = () => {
      setIsOpen(true)
    }

    const controllingListener = window.workbox.addEventListener('controlling', handleControlling)
    const waitingListener = window.workbox.addEventListener('waiting', handleWaiting)
    window.workbox.register()

    return () => {
      if (controllingListener && typeof controllingListener === 'function') {
        controllingListener()
      }
      if (waitingListener && typeof waitingListener === 'function') {
        waitingListener()
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <GenericConfirmModal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={handleConfirm}
      title={t('pwa.updateAvailable', { defaultValue: 'Update available' })}
      message={t('pwa.updateMessage', {
        defaultValue: 'Lasius has been updated. The page will reload after your confirmation.',
      })}
      confirmLabel={t('pwa.reloadApplication', { defaultValue: 'Reload application' })}
      cancelLabel={t('common.actions.cancel', { defaultValue: 'Cancel' })}
      confirmVariant="primary"
      blockViewport
    />
  )
}

export default LasiusPwaUpdater
