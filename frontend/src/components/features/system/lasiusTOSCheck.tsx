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
import { DEV, LASIUS_TERMSOFSERVICE_VERSION } from 'projectConfig/constants'
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
    // In development mode, always show ToS dialog when logged in
    // In production, only show if version doesn't match
    const shouldShowToS = DEV
      ? lasiusIsLoggedIn && currentTOSVersion
      : lasiusIsLoggedIn && currentTOSVersion && acceptedTOSVersion != currentTOSVersion

    if (shouldShowToS) {
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
        {DEV && (
          <div className="bg-warning/10 border-warning text-warning-content mb-4 rounded-lg border p-3 text-sm">
            <strong>Development Mode:</strong> This Terms of Service dialog is shown on every login
            in development mode for testing purposes.
          </div>
        )}
        <div
          className="bg-base-200 max-h-[400px] overflow-y-auto p-4"
          dangerouslySetInnerHTML={{ __html: tosHtml }}
        />
      </ModalConfirm>
    )
  )
}
