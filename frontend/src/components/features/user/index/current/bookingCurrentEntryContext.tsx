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
import { Modal } from 'components/ui/overlays/modal/Modal'
import { differenceInSeconds } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import { useGetAdjacentBookings } from 'lib/api/hooks/useGetAdjacentBookings'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { updateUserBookingCurrent } from 'lib/api/lasius/user-bookings/user-bookings'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ArrowDownToLine, Pencil } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

import { BookingEditRunning } from '../bookingEditRunning'

type Props = {
  item: ModelsBooking
}

export const BookingCurrentEntryContext: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()
  const { selectedOrganisationId } = useOrganisation()
  const { previous: previousBooking } = useGetAdjacentBookings(item)

  const handleClose = () => setIsOpen(false)

  // Helper function to check if two times are within 1 minute of each other
  const areTimesWithinOneMinute = (time1: string | Date, time2: string | Date): boolean => {
    return Math.abs(differenceInSeconds(time1, time2)) <= 60
  }

  // Check if start time needs adjustment (not already aligned with previous end)
  const shouldShowStartAdjustment =
    previousBooking?.end?.dateTime &&
    !areTimesWithinOneMinute(item.start.dateTime, previousBooking.end.dateTime)

  const editCurrentBooking = () => {
    setIsOpen(true)
    handleCloseAll()
  }

  const adjustStartToPrevious = async () => {
    if (previousBooking?.end?.dateTime) {
      await updateUserBookingCurrent(selectedOrganisationId, item.id, {
        newStart: formatISOLocale(new Date(previousBooking.end.dateTime)),
      })
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
                {shouldShowStartAdjustment && (
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
                <ContextButtonAddFavorite item={item} />
                <ContextBarDivider />
                <ContextButtonClose />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      <Modal open={isOpen} onClose={handleClose}>
        <BookingEditRunning item={item} onSave={handleClose} onCancel={handleClose} />
      </Modal>
    </>
  )
}
