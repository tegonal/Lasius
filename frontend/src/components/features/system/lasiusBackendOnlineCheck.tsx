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

import { useLasiusApiStatus } from 'components/features/system/hooks/useLasiusApiStatus'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import { CONNECTION_STATUS } from 'projectConfig/constants'
import React, { useEffect } from 'react'

export const LasiusBackendOnlineCheck: React.FC = () => {
  const { t } = useTranslation('common')
  const { modalId, openModal, closeModal, isModalOpen } = useModal('BackendOfflineNoticeModal')
  const { status } = useLasiusApiStatus()

  useEffect(() => {
    if (status !== CONNECTION_STATUS.CONNECTED && !isModalOpen) {
      logger.info('LasiusBackendOnlineCheck', status)
      openModal()
    }
    if (status === CONNECTION_STATUS.CONNECTED && isModalOpen) {
      logger.info('LasiusBackendOnlineCheck', status)
      closeModal()
    }
  }, [closeModal, isModalOpen, openModal, status])

  return (
    <ModalResponsive modalId={modalId} blockViewport>
      <div>
        {t('system.offlineMessage', {
          defaultValue:
            'Lasius is currently offline or undergoing maintenance. We will be back shortly.',
        })}
      </div>
    </ModalResponsive>
  )
}
