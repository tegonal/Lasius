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

import { IndexColumnTabs } from 'components/features/user/index/indexColumnTabs'
import { Button } from 'components/primitives/buttons/Button'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { PlusCircleIcon } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const BookingAddMobileButton: React.FC = () => {
  const { modalId, openModal, closeModal } = useModal('BookingAddMobileModal')
  const { t } = useTranslation('common')

  return (
    <div>
      <Button variant="primary" shape="circle" onClick={openModal} fullWidth={false}>
        <LucideIcon icon={PlusCircleIcon} size={24} />
      </Button>
      <ModalResponsive minHeight="575px" modalId={modalId}>
        <div className="grid h-full grid-rows-[auto_min-content_min-content] gap-0">
          <IndexColumnTabs />
          <FormElementSpacer />
          <FormElement>
            <Button type="button" variant="secondary" onClick={closeModal}>
              {t('common.actions.close', { defaultValue: 'Close' })}
            </Button>
          </FormElement>
        </div>
      </ModalResponsive>
    </div>
  )
}
