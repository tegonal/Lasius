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

import { SelectUserOrganisationModal } from 'components/features/user/selectUserOrganisationModal'
import { Button } from 'components/primitives/buttons/Button'
import { AvatarOrganisation } from 'components/ui/data-display/avatar/avatarOrganisation'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import { useIsClient } from 'usehooks-ts'

export const MODAL_SELECT_ORGANISATION = 'SelectOrganisationModal'

export const SelectUserOrganisation: React.FC = () => {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const { selectedOrganisationKey, selectedOrganisation } = useOrganisation()
  const isClient = useIsClient()

  const handleClose = () => setIsOpen(false)

  if (!isClient) return null
  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex"
        fullWidth={false}>
        <AvatarOrganisation name={selectedOrganisationKey || ''} size={24} />
        <span>
          {selectedOrganisation?.private
            ? t('organisations.myPersonalOrganisation', {
                defaultValue: 'My personal organisation',
              })
            : selectedOrganisationKey}
        </span>
      </Button>
      <Modal open={isOpen} onClose={handleClose}>
        <SelectUserOrganisationModal onClose={handleClose} />
        <ButtonGroup>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </ButtonGroup>
      </Modal>
    </>
  )
}
