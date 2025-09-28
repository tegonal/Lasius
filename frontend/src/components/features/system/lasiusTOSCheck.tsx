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
import { useProfile } from 'lib/api/hooks/useProfile'
import { signOut } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { LASIUS_TERMSOFSERVICE_VERSION } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'

export const LasiusTOSCheck: React.FC = () => {
  const [showAcceptTOSDialog, setShowAcceptTOSDialog] = useState<boolean>(false)
  const defaultTosHtml =
    '<p>The Terms of Service are not available in the current language. Please change to a supported language.</p>'
  const [tosHtml, setTosHtml] = useState<string>(defaultTosHtml)
  const { i18n, t } = useTranslation('common')
  const { acceptedTOSVersion, acceptTOS, lasiusIsLoggedIn } = useProfile()

  const currentTOSVersion = LASIUS_TERMSOFSERVICE_VERSION

  const handleConfirm = () => {
    acceptTOS(currentTOSVersion)
    setShowAcceptTOSDialog(false)
  }

  const handleCancel = () => {
    signOut()
    setShowAcceptTOSDialog(false)
  }

  const setLocalizedTosText = () => {
    fetch('/termsofservice/' + i18n.language + '.html').then((response) => {
      if (response.status == 200) {
        response.text().then((resultsHTML) => {
          setTosHtml(resultsHTML)
        })
      }
    })
  }

  useEffect(() => {
    if (lasiusIsLoggedIn && currentTOSVersion && acceptedTOSVersion != currentTOSVersion) {
      setLocalizedTosText()
      setShowAcceptTOSDialog(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedTOSVersion, lasiusIsLoggedIn, i18n.language])

  return (
    showAcceptTOSDialog && (
      <ModalConfirm
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        text={{
          action: t('tos.acceptMessage', {
            defaultValue:
              'Please accept the following Terms of Service (version {{version}}), if you want to continue using Lasius:',
            version: currentTOSVersion,
          }),
          confirm: t('tos.actions.accept', { defaultValue: 'Accept Terms of Service' }),
          cancel: t('tos.actions.reject', { defaultValue: 'Reject and logout' }),
        }}
        autoSize={true}>
        <div
          className="bg-base-200 max-h-[400px] overflow-y-auto p-4"
          dangerouslySetInnerHTML={{ __html: tosHtml }}
        />
      </ModalConfirm>
    )
  )
}
