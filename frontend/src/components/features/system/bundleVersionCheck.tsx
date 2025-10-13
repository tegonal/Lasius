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
import { nextJsAxiosInstance } from 'lib/api/nextJsAxiosInstance'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import { BuildIdResponse } from 'pages/api/build-id'
import { getLasiusVersion } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'

export const BundleVersionCheck: React.FC = () => {
  const { t } = useTranslation('common')
  const { data, isLoading } = useSWR<BuildIdResponse>('/api/build-id', nextJsAxiosInstance, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
  })
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false)

  useEffect(() => {
    const localVersion = getLasiusVersion()
    if (!data || isLoading || !data.buildId || !localVersion) {
      return
    }
    setShouldRefresh(data.buildId !== localVersion)
  }, [data, isLoading])

  const handleConfirm = () => {
    window.location.reload()
  }

  if (data) {
    logger.info('[BundleVersionCheck]', {
      serverVersion: data?.buildId,
      clientVersion: getLasiusVersion(),
      shouldRefresh,
    })
  }

  return (
    <>
      {shouldRefresh && (
        <GenericConfirmModal
          open={shouldRefresh}
          onClose={() => setShouldRefresh(false)}
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
      )}
    </>
  )
}
