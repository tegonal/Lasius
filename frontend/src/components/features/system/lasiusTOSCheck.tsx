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

import { Button } from 'components/primitives/buttons/Button'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalDescription } from 'components/ui/overlays/modal/ModalDescription'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
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
    const language = i18n.language
    fetch('/termsofservice/' + language + '.html')
      .then((response) => {
        if (response.status == 200) {
          return response.text()
        }
        // Fallback to English if language-specific TOS not found
        return fetch('/termsofservice/en.html').then((fallbackResponse) => {
          if (fallbackResponse.status == 200) {
            return fallbackResponse.text().then((englishHtml) => {
              // Prepend fallback notice
              const fallbackNotice = `
                <div style="background-color: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
                  <strong>Note:</strong> The Terms of Service are not available in your language (${language}).
                  The English version is displayed below.
                </div>
              `
              return fallbackNotice + englishHtml
            })
          }
          return defaultTosHtml
        })
      })
      .then((resultsHTML) => {
        setTosHtml(resultsHTML)
      })
      .catch(() => {
        setTosHtml(defaultTosHtml)
      })
  }

  useEffect(() => {
    // Only show if version doesn't match
    const shouldShowToS =
      lasiusIsLoggedIn && currentTOSVersion && acceptedTOSVersion != currentTOSVersion

    if (shouldShowToS) {
      setLocalizedTosText()
      setShowAcceptTOSDialog(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedTOSVersion, lasiusIsLoggedIn, i18n.language])

  return (
    <Modal open={showAcceptTOSDialog} onClose={handleCancel} blockViewport>
      <div className="flex flex-col gap-4">
        <ModalHeader>
          {t('tos.title', {
            defaultValue: 'Terms of Service (version {{version}})',
            version: currentTOSVersion,
          })}
        </ModalHeader>

        <ModalDescription>
          {t('tos.acceptMessage', {
            defaultValue:
              'Please accept the following Terms of Service (version {{version}}), if you want to continue using Lasius:',
            version: currentTOSVersion,
          })}
        </ModalDescription>

        <div
          className="bg-base-200 max-h-[400px] overflow-y-auto rounded-lg p-4"
          dangerouslySetInnerHTML={{ __html: tosHtml }}
        />

        <ButtonGroup>
          <Button type="button" variant="primary" onClick={handleConfirm}>
            {t('tos.actions.accept', { defaultValue: 'Accept Terms of Service' })}
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {t('tos.actions.reject', { defaultValue: 'Reject and logout' })}
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  )
}
