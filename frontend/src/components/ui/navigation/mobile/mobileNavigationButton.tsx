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
import { MODAL_SELECT_ORGANISATION } from 'components/features/user/selectUserOrganisation'
import { Button } from 'components/primitives/buttons/Button'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React from 'react'

export const MobileNavigationButton: React.FC = () => {
  const { modalId, openModal, closeModal } = useModal('MobileNavigationButtonModal')
  const { t } = useTranslation('common')
  const router = useRouter()
  const { locale, pathname, query, asPath } = router
  const organisationSelectModal = useModal(MODAL_SELECT_ORGANISATION)
  const { signOut } = useSignOut()

  const switchLanguage = (newLocale: string) => {
    router.push({ pathname, query }, asPath, { locale: newLocale })
    closeModal()
  }

  return (
    <>
      <Button variant="secondary" shape="circle" onClick={openModal} fullWidth={false}>
        <Icon name="navigation-menu-vertical-interface-essential" size={24} />
      </Button>
      <ModalResponsive modalId={modalId}>
        <FieldSet>
          <FormElement>
            <Button
              onClick={organisationSelectModal.openModal}
              aria-label={t('organizations.actions.switch', {
                defaultValue: 'Switch organisation',
              })}>
              {t('organizations.actions.switch', { defaultValue: 'Switch organisation' })}
            </Button>
          </FormElement>
          <FormElementSpacer />
          <FormElement>
            <div className="flex gap-2">
              <Button
                onClick={() => switchLanguage('en')}
                variant={locale === 'en' ? 'primary' : 'secondary'}
                aria-label="English"
                fullWidth>
                🇬🇧 English
              </Button>
              <Button
                onClick={() => switchLanguage('de')}
                variant={locale === 'de' ? 'primary' : 'secondary'}
                aria-label="Deutsch"
                fullWidth>
                🇩🇪 Deutsch
              </Button>
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
              onClick={closeModal}
              aria-label={t('common.actions.cancel', { defaultValue: 'Cancel' })}>
              {t('common.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </FormElement>
        </FieldSet>
      </ModalResponsive>
    </>
  )
}
