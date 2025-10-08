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

import { ContextButtonClose } from 'components/features/contextMenu/buttons/contextButtonClose'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextButtonStartBooking } from 'components/features/contextMenu/buttons/contextButtonStartBooking'
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { BookingAddUpdateForm } from 'components/features/user/index/bookingAddUpdateForm'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { AnimatePresence } from 'framer-motion'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { deleteUserBooking } from 'lib/api/lasius/user-bookings/user-bookings'
import { Pencil, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

type Props = {
  item: ModelsBooking
  allowDelete?: boolean
  allowEdit?: boolean
}

export const BookingHistoryItemContext: React.FC<Props> = ({
  item,
  allowDelete = false,
  allowEdit = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')
  const { actionAddBookingToFavorites, handleCloseAll, currentOpenContextMenuId } = useContextMenu()
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
        <AnimatePresence>
          {currentOpenContextMenuId === item.id && (
            <ContextAnimatePresence variant="compact">
              <ContextBar>
                <ContextButtonStartBooking variant="compact" item={item} />
                {allowEdit && (
                  <ContextButtonWrapper variant="compact">
                    <Button
                      title={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                      aria-label={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                      variant="contextIcon"
                      onClick={() => updateItem()}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={Pencil} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                )}
                <ContextButtonWrapper variant="compact">
                  <Button
                    title={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
                    aria-label={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
                    variant="contextIcon"
                    onClick={() => actionAddBookingToFavorites(selectedOrganisationId, item)}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Star} size={24} />
                  </Button>
                </ContextButtonWrapper>
                {allowDelete && (
                  <ContextButtonWrapper variant="compact">
                    <Button
                      title={t('bookings.actions.delete', { defaultValue: 'Delete booking' })}
                      aria-label={t('bookings.actions.delete', { defaultValue: 'Delete booking' })}
                      variant="contextIcon"
                      onClick={() => deleteItem()}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={Trash2} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                )}
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      <Modal open={isOpen} onClose={handleClose}>
        <BookingAddUpdateForm
          mode="update"
          itemUpdate={item}
          onSave={handleClose}
          onCancel={handleClose}
        />
      </Modal>
    </>
  )
}
