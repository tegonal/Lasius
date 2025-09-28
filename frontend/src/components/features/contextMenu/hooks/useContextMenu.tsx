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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { roundToNearestMinutes } from 'date-fns'
import {
  ModelsBooking,
  ModelsBookingStub,
  ModelsCurrentUserTimeBooking,
  ModelsTag,
} from 'lib/api/lasius'
import {
  deleteUserBooking,
  getGetUserBookingCurrentKey,
  getUserBookingCurrent,
  startUserBookingCurrent,
  stopUserBookingCurrent,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { addFavoriteBooking } from 'lib/api/lasius/user-favorites/user-favorites'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import { useCallback } from 'react'
import { useCalendarActions } from 'stores/calendarStore'
import { useContextMenuOpen, useUIActions } from 'stores/uiStore'
import { mutate } from 'swr'

/**
 * Context menu hook now using Zustand for state management
 * This provides better performance by preventing unnecessary re-renders
 */
export const useContextMenu = () => {
  const { closeModal } = useModal('BookingAddMobileModal')
  const { addToast } = useToast()
  const { t } = useTranslation('common')

  // Zustand state and actions
  const contextMenuOpen = useContextMenuOpen()
  const { setContextMenuOpen, closeContextMenu } = useUIActions()
  const { setSelectedDate } = useCalendarActions()

  const handleOpenContextMenu = useCallback(
    (hash: string) => {
      setContextMenuOpen(hash)
    },
    [setContextMenuOpen],
  )

  const handleCloseContextMenu = useCallback(
    (hash: string) => {
      if (hash && contextMenuOpen === hash) {
        closeContextMenu()
      }
    },
    [contextMenuOpen, closeContextMenu],
  )

  const handleCloseAll = useCallback(() => {
    closeContextMenu()
  }, [closeContextMenu])

  const actionStartBooking = useCallback(
    async (
      selectedOrganisationId: string,
      item: ModelsBooking | ModelsCurrentUserTimeBooking | ModelsBookingStub,
    ) => {
      let projectId = ''
      let tags: ModelsTag[] = []

      if ('projectReference' in item) {
        projectId = item.projectReference.id
        tags = item.tags
      }

      if ('booking' in item && item.booking) {
        projectId = item.booking.projectReference.id
        tags = item.booking.tags
      }

      // Fetch current booking only when needed
      const currentBooking = await getUserBookingCurrent()

      if (currentBooking?.booking?.id) {
        await stopUserBookingCurrent(selectedOrganisationId, currentBooking.booking.id, {
          end: formatISOLocale(roundToNearestMinutes(new Date(), { roundingMethod: 'floor' })),
        })
        await mutate(getGetUserBookingCurrentKey())
        setSelectedDate(formatISOLocale(new Date()))
      }

      await startUserBookingCurrent(selectedOrganisationId, {
        projectId,
        tags,
        start: formatISOLocale(roundToNearestMinutes(new Date(), { roundingMethod: 'floor' })),
      })
      handleCloseAll()
      closeModal()
    },
    [setSelectedDate, handleCloseAll, closeModal],
  )

  const actionDeleteBooking = useCallback(
    async (selectedOrganisationId: string, item: ModelsBooking) => {
      await deleteUserBooking(selectedOrganisationId, item.id)
      handleCloseAll()
    },
    [handleCloseAll],
  )

  const actionAddBookingToFavorites = useCallback(
    async (selectedOrganisationId: string, item: ModelsBooking) => {
      const {
        projectReference: { id: projectId },
        tags,
      } = item
      await addFavoriteBooking(selectedOrganisationId, { projectId, tags })
      addToast({
        message: t('bookings.actions.addedToFavorites', {
          defaultValue: 'Booking added to favorites',
        }),
        type: 'SUCCESS',
      })
      handleCloseAll()
    },
    [addToast, t, handleCloseAll],
  )

  return {
    actionAddBookingToFavorites,
    handleOpenContextMenu,
    handleCloseContextMenu,
    actionStartBooking,
    actionDeleteBooking,
    currentOpenContextMenuId: contextMenuOpen,
    handleCloseAll,
  }
}
