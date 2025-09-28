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

import { ModalConfirm } from 'components/ui/overlays/modal/modalConfirm'
import { nextJsAxiosInstance } from 'lib/api/nextJsAxiosInstance'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import { BuildIdResponse } from 'pages/api/build-id'
import { BUILD_ID } from 'projectConfig/constants'
import { LOCAL_VERSION_CHECK_INTERVAL } from 'projectConfig/intervals'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'

export const BundleVersionCheck: React.FC = () => {
  const { t } = useTranslation('common')
  const { data, isLoading } = useSWR<BuildIdResponse>('/api/build-id', nextJsAxiosInstance, {
    refreshInterval: LOCAL_VERSION_CHECK_INTERVAL,
    revalidateOnMount: true,
    refreshWhenHidden: true,
  })
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false)

  useEffect(() => {
    if (!data || isLoading || !data.buildId || !BUILD_ID) {
      return
    }
    setShouldRefresh(data.buildId !== BUILD_ID)
  }, [data, isLoading])

  const handleConfirm = () => {
    window.location.reload()
  }

  if (data) {
    logger.info('[BundleVersionCheck]', {
      apiBuildId: data?.buildId,
      localBuildId: BUILD_ID,
      shouldRefresh,
    })
  }

  return (
    <>
      {shouldRefresh && (
        <ModalConfirm
          onConfirm={handleConfirm}
          text={{
            action: t('pwa.updateMessage', {
              defaultValue:
                'Lasius has been updated. The page will reload after your confirmation.',
            }),
            confirm: t('pwa.reloadApplication', { defaultValue: 'Reload application' }),
          }}
        />
      )}
    </>
  )
}
