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
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextCompactAnimatePresence } from 'components/features/contextMenu/contextCompactAnimatePresence'
import { ContextCompactBody } from 'components/features/contextMenu/contextCompactBody'
import { ContextCompactButtonWrapper } from 'components/features/contextMenu/contextCompactButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { BookingAddUpdateForm } from 'components/features/user/index/bookingAddUpdateForm'
import { Button } from 'components/primitives/buttons/Button'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { AnimatePresence } from 'framer-motion'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { deleteUserBooking } from 'lib/api/lasius/user-bookings/user-bookings'
import { useTranslation } from 'next-i18next'
import React from 'react'

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
  const { modalId, openModal, closeModal } = useModal(`EditModal-${item.id}`)
  const { t } = useTranslation('common')
  const { actionAddBookingToFavorites, handleCloseAll, currentOpenContextMenuId } = useContextMenu()
  const { selectedOrganisationId } = useOrganisation()

  const deleteItem = async () => {
    await deleteUserBooking(selectedOrganisationId, item.id)
    handleCloseAll()
  }

  const updateItem = () => {
    openModal()
    handleCloseAll()
  }

  return (
    <>
      <ContextCompactBody>
        <ContextButtonOpen hash={item.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.id && (
            <ContextCompactAnimatePresence>
              <ContextBar>
                <ContextButtonStartBooking variant="compact" item={item} />
                {allowEdit && (
                  <ContextCompactButtonWrapper>
                    <Button
                      title={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                      aria-label={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                      variant="contextIcon"
                      onClick={() => updateItem()}
                      fullWidth={false}
                      shape="circle">
                      <Icon name="time-clock-file-edit-interface-essential" size={24} />
                    </Button>
                  </ContextCompactButtonWrapper>
                )}
                <ContextCompactButtonWrapper>
                  <Button
                    title={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
                    aria-label={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
                    variant="contextIcon"
                    onClick={() => actionAddBookingToFavorites(selectedOrganisationId, item)}
                    fullWidth={false}
                    shape="circle">
                    <Icon name="rating-star-add-social-medias-rewards-rating" size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                {allowDelete && (
                  <ContextCompactButtonWrapper>
                    <Button
                      title={t('bookings.actions.delete', { defaultValue: 'Delete booking' })}
                      aria-label={t('bookings.actions.delete', { defaultValue: 'Delete booking' })}
                      variant="contextIcon"
                      onClick={() => deleteItem()}
                      fullWidth={false}
                      shape="circle">
                      <Icon name="bin-2-alternate-interface-essential" size={24} />
                    </Button>
                  </ContextCompactButtonWrapper>
                )}
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextCompactAnimatePresence>
          )}
        </AnimatePresence>
      </ContextCompactBody>
      <ModalResponsive modalId={modalId}>
        <BookingAddUpdateForm
          mode="update"
          itemUpdate={item}
          onSave={closeModal}
          onCancel={closeModal}
        />
      </ModalResponsive>
    </>
  )
}
