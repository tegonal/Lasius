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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarOrganisation } from '~/components/ui/data-display/avatar/avatar-organisation'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { OrgSwitcherModal } from '~/features/organisation/components/org-switcher-modal'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'

export const OrgSwitcher = () => {
  const { t } = useTranslation('organisation')
  const [isOpen, setIsOpen] = useState(false)
  const { selectedOrganisation, selectedOrganisationKey } = useOrganisation()

  const handleClose = () => setIsOpen(false)

  return (
    <>
      <button
        className="btn btn-ghost hidden md:flex"
        data-testid="org-selector-btn"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <AvatarOrganisation name={selectedOrganisationKey || ''} size={24} />
        <span>
          {selectedOrganisation?.private
            ? t('myPersonalOrganisation', 'My personal organisation')
            : selectedOrganisationKey}
        </span>
      </button>
      <Modal onClose={handleClose} open={isOpen}>
        <ModalCloseButton onClose={handleClose} />
        <OrgSwitcherModal onClose={handleClose} />
        <ButtonGroup>
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            type="button"
          >
            {t('actions.close', 'Close')}
          </button>
        </ButtonGroup>
      </Modal>
    </>
  )
}
