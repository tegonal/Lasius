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

import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { BookingAddUpdateForm } from '~/features/bookings/components/booking-add-update-form'
import { ContextButtonAddFavorite } from '~/features/context-menu/buttons/context-button-add-favorite'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextButtonStartBooking } from '~/features/context-menu/buttons/context-button-start-booking'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { type ModelsBooking } from '~/services/api/lasius'
import { deleteUserBooking } from '~/services/api/lasius/user-bookings/user-bookings'

type Props = {
  allowDelete?: boolean
  allowEdit?: boolean
  item: ModelsBooking
}

export const BookingHistoryItemContext = ({
  allowDelete = false,
  allowEdit = false,
  item,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
  const { selectedOrganisationId } = useOrganisation()

  const handleClose = () => setIsOpen(false)

  const deleteItem = async () => {
    await deleteUserBooking(selectedOrganisationId, item.id)
    handleCloseAll()
  }

  const updateItem = () => {
    setIsOpen(true)
    handleCloseAll()
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={item.id} />
        {currentOpenContextMenuId === item.id && (
          <ContextAnimatePresence variant="compact">
            <ContextBar>
              <ContextButtonStartBooking item={item} variant="compact" />
              {allowEdit && (
                <ContextButtonWrapper variant="compact">
                  <Button
                    aria-label={t('bookings:actions.edit', 'Edit booking')}
                    fullWidth={false}
                    onClick={() => updateItem()}
                    shape="circle"
                    title={t('bookings:actions.edit', 'Edit booking')}
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Pencil} size={24} />
                  </Button>
                </ContextButtonWrapper>
              )}
              <ContextButtonAddFavorite item={item} variant="compact" />
              {allowDelete && (
                <ContextButtonWrapper variant="compact">
                  <Button
                    aria-label={t('bookings:actions.delete', 'Delete booking')}
                    fullWidth={false}
                    onClick={() => void deleteItem()}
                    shape="circle"
                    title={t('bookings:actions.delete', 'Delete booking')}
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Trash2} size={24} />
                  </Button>
                </ContextButtonWrapper>
              )}
              <ContextBarDivider />
              <ContextButtonClose variant="compact" />
            </ContextBar>
          </ContextAnimatePresence>
        )}
      </ContextBody>
      <Modal onClose={handleClose} open={isOpen}>
        <BookingAddUpdateForm
          itemUpdate={item}
          mode="update"
          onClose={handleClose}
          selectedOrgId={selectedOrganisationId}
        />
      </Modal>
    </>
  )
}
