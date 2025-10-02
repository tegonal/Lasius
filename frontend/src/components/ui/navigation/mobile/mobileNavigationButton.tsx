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

import { useSignOut } from 'components/features/system/hooks/useSignOut'
import { Button } from 'components/primitives/buttons/Button'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { SUPPORTED_LOCALES } from 'lib/config/locales'
import { EllipsisVertical } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

// Language display configuration
const languageConfig: Record<string, { flag: string; name: string }> = {
  en: { flag: '🇬🇧', name: 'English' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
}

export const MobileNavigationButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const { pathname, query, asPath } = router
  const { signOut } = useSignOut()

  const handleClose = () => setIsOpen(false)

  const switchLanguage = (newLocale: string) => {
    router.push({ pathname, query }, asPath, { locale: newLocale })
    handleClose()
  }

  const openOrgSelect = () => {
    // TODO: Implement organization selection modal
  }

  return (
    <>
      <Button variant="secondary" shape="circle" onClick={() => setIsOpen(true)} fullWidth={false}>
        <LucideIcon icon={EllipsisVertical} />
      </Button>
      <Modal open={isOpen} onClose={handleClose}>
        <FieldSet>
          <FormElement>
            <Button
              onClick={openOrgSelect}
              aria-label={t('organisations.actions.switch', {
                defaultValue: 'Switch organisation',
              })}>
              {t('organisations.actions.switch', { defaultValue: 'Switch organisation' })}
            </Button>
          </FormElement>
          <FormElementSpacer />
          <FormElement>
            <div className="flex gap-2">
              {SUPPORTED_LOCALES.map((lang) => {
                const config = languageConfig[lang]
                if (!config) return null // Skip if no config for this locale
                return (
                  <Button
                    key={lang}
                    onClick={() => switchLanguage(lang)}
                    variant={i18n.language === lang ? 'primary' : 'secondary'}
                    aria-label={config.name}
                    fullWidth>
                    {config.flag} {config.name}
                  </Button>
                )
              })}
            </div>
          </FormElement>
          <FormElementSpacer />
          <FormElement>
            <Button
              onClick={signOut}
              aria-label={t('auth.actions.signOut', { defaultValue: 'Sign out' })}>
              {t('auth.actions.signOut', { defaultValue: 'Sign out' })}
            </Button>
          </FormElement>
          <FormElementSpacer />
          <FormElement>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              aria-label={t('common.actions.cancel', { defaultValue: 'Cancel' })}>
              {t('common.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </FormElement>
        </FieldSet>
      </Modal>
    </>
  )
}
