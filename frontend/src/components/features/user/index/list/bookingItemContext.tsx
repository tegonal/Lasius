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

import { ContextButtonAddFavorite } from 'components/features/contextMenu/buttons/contextButtonAddFavorite'
import { ContextButtonClose } from 'components/features/contextMenu/buttons/contextButtonClose'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextButtonStartBooking } from 'components/features/contextMenu/buttons/contextButtonStartBooking'
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { BookingAddUpdateForm } from 'components/features/user/index/bookingAddUpdateForm'
import { Button } from 'components/primitives/buttons/Button'
import { Icon } from 'components/ui/icons/Icon'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { AnimatePresence } from 'framer-motion'
import { useGetAdjacentBookings } from 'lib/api/hooks/useGetAdjacentBookings'
import { ModelsBooking } from 'lib/api/lasius'
import { updateUserBooking } from 'lib/api/lasius/user-bookings/user-bookings'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useSelectedOrganisationId } from 'stores/organisationStore'

type Props = {
  item: ModelsBooking
}

export const BookingItemContext: React.FC<Props> = ({ item }) => {
  const { modalId, openModal, closeModal } = useModal(`EditModal-${item.id}`)
  const { t } = useTranslation('common')
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
  const selectedOrganisationId = useSelectedOrganisationId()
  const { previous: previousBooking, next: nextBooking } = useGetAdjacentBookings(item)

  const deleteItem = async () => {
    const { deleteUserBooking } = await import('lib/api/lasius/user-bookings/user-bookings')
    await deleteUserBooking(selectedOrganisationId, item.id)
    handleCloseAll()
  }

  const updateItem = () => {
    openModal()
    handleCloseAll()
  }

  const adjustStartToPrevious = async () => {
    if (previousBooking?.end?.dateTime) {
      const payload = {
        ...item,
        start: formatISOLocale(new Date(previousBooking.end.dateTime)),
        end: item.end ? formatISOLocale(new Date(item.end.dateTime)) : undefined,
        projectId: item.projectReference?.id || '',
        tags: item.tags || [],
      }

      await updateUserBooking(selectedOrganisationId, item.id, payload)
      handleCloseAll()
    }
  }

  const adjustEndToNext = async () => {
    if (nextBooking?.start?.dateTime && item.end) {
      const payload = {
        ...item,
        start: formatISOLocale(new Date(item.start.dateTime)),
        end: formatISOLocale(new Date(nextBooking.start.dateTime)),
        projectId: item.projectReference?.id || '',
        tags: item.tags || [],
      }

      await updateUserBooking(selectedOrganisationId, item.id, payload)
      handleCloseAll()
    }
  }

  return (
    <>
      <ContextBody>
        <ContextButtonOpen hash={item.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.id && (
            <ContextAnimatePresence>
              <ContextBar>
                <ContextButtonStartBooking item={item} />
                <ContextButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                    aria-label={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                    onClick={() => updateItem()}
                    fullWidth={false}
                    shape="circle">
                    <Icon name="time-clock-file-edit-interface-essential" size={24} />
                  </Button>
                </ContextButtonWrapper>
                {previousBooking?.end?.dateTime && (
                  <ContextButtonWrapper>
                    <Button
                      variant="contextIcon"
                      title={t('bookings.actions.adjustStartToPrevious', {
                        defaultValue: 'Adjust start to previous booking',
                      })}
                      aria-label={t('bookings.actions.adjustStartToPrevious', {
                        defaultValue: 'Adjust start to previous booking',
                      })}
                      onClick={() => adjustStartToPrevious()}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={ArrowDownToLine} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                )}
                {nextBooking?.start?.dateTime && item.end && (
                  <ContextButtonWrapper>
                    <Button
                      variant="contextIcon"
                      title={t('bookings.actions.adjustEndToNext', {
                        defaultValue: 'Adjust end to next booking',
                      })}
                      aria-label={t('bookings.actions.adjustEndToNext', {
                        defaultValue: 'Adjust end to next booking',
                      })}
                      onClick={() => adjustEndToNext()}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={ArrowUpToLine} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                )}
                <ContextButtonAddFavorite item={item} />
                <ContextButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('bookings.actions.delete', { defaultValue: 'Delete booking' })}
                    aria-label={t('bookings.actions.delete', { defaultValue: 'Delete booking' })}
                    onClick={() => deleteItem()}
                    fullWidth={false}
                    shape="circle">
                    <Icon name="bin-2-alternate-interface-essential" size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextButtonClose />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
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
