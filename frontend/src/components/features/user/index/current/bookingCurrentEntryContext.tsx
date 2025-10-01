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
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { AnimatePresence } from 'framer-motion'
import { ModelsBooking } from 'lib/api/lasius'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

import { BookingEditRunning } from '../bookingEditRunning'

type Props = {
  item: ModelsBooking
}

export const BookingCurrentEntryContext: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const { modalId, openModal, closeModal } = useModal('BookingEditCurrentModal')
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()

  const editCurrentBooking = () => {
    openModal()
    handleCloseAll()
  }

  return (
    <>
      <ContextBody>
        <ContextButtonOpen hash={item.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.id && (
            <ContextAnimatePresence>
              <ContextBar>
                <ContextButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                    aria-label={t('bookings.actions.edit', { defaultValue: 'Edit booking' })}
                    onClick={editCurrentBooking}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Pencil} size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextButtonAddFavorite item={item} />
                <ContextBarDivider />
                <ContextButtonClose />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      <ModalResponsive modalId={modalId}>
        <BookingEditRunning item={item} onSave={closeModal} onCancel={closeModal} />
      </ModalResponsive>
    </>
  )
}
