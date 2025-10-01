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
import { useCallback } from 'react'
import { useCalendarActions } from 'stores/calendarStore'
import { useContextMenuOpen, useUIActions } from 'stores/uiStore'
import { mutate } from 'swr'

/**
 * Custom hook for managing context menu state and actions for bookings.
 * Uses Zustand for state management to prevent unnecessary re-renders.
 * Provides actions for starting bookings, deleting bookings, and managing favorites.
 *
 * @returns Object containing:
 *   - actionAddBookingToFavorites: Function to add a booking to user favorites
 *   - handleOpenContextMenu: Function to open context menu by hash ID
 *   - handleCloseContextMenu: Function to close specific context menu by hash ID
 *   - actionStartBooking: Function to start a new booking (stops current if exists)
 *   - actionDeleteBooking: Function to delete a booking
 *   - currentOpenContextMenuId: ID of the currently open context menu
 *   - handleCloseAll: Function to close all context menus
 *
 * @example
 * const {
 *   handleOpenContextMenu,
 *   actionStartBooking,
 *   actionDeleteBooking,
 *   currentOpenContextMenuId
 * } = useContextMenu()
 *
 * // Open context menu for a booking
 * handleOpenContextMenu(bookingHash)
 *
 * // Start a booking (automatically stops current one)
 * await actionStartBooking(orgId, booking)
 */
export const useContextMenu = () => {
  const { closeModal } = useModal('BookingAddMobileModal')

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
      handleCloseAll()
    },
    [handleCloseAll],
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
