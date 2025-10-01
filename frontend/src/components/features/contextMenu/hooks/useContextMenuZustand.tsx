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
  startUserBookingCurrent,
  stopUserBookingCurrent,
  useGetUserBookingCurrent,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { addFavoriteBooking } from 'lib/api/lasius/user-favorites/user-favorites'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import { useCalendarActions } from 'stores/calendarStore'
import { useContextMenuOpen, useUIActions } from 'stores/uiStore'
import { mutate } from 'swr'
import { useIsClient } from 'usehooks-ts'

/**
 * Enhanced context menu hook with Zustand state management and live current booking tracking.
 * Similar to useContextMenu but fetches and uses current booking data directly.
 * Provides optimized performance by preventing unnecessary re-renders.
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
 * @remarks
 * This version uses `useGetUserBookingCurrent` to access live current booking data,
 * whereas useContextMenu fetches it only when needed.
 *
 * @example
 * const {
 *   actionStartBooking,
 *   currentOpenContextMenuId,
 *   handleCloseAll
 * } = useContextMenuZustand()
 *
 * // Start booking (handles stopping current booking automatically)
 * await actionStartBooking(orgId, selectedBooking)
 */
export const useContextMenuZustand = () => {
  const { closeModal } = useModal('BookingAddMobileModal')
  const { addToast } = useToast()
  const { t } = useTranslation('common')
  const isClient = useIsClient()

  // Zustand state and actions
  const contextMenuOpen = useContextMenuOpen()
  const { setContextMenuOpen, closeContextMenu } = useUIActions()
  const { setSelectedDate } = useCalendarActions()

  const { data: currentBooking } = useGetUserBookingCurrent({ swr: { enabled: isClient } })

  const handleOpenContextMenu = (hash: string) => {
    setContextMenuOpen(hash)
  }

  const handleCloseContextMenu = (hash: string) => {
    if (hash && contextMenuOpen === hash) {
      closeContextMenu()
    }
  }

  const handleCloseAll = () => {
    closeContextMenu()
  }

  const actionStartBooking = async (
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
  }

  const actionDeleteBooking = async (selectedOrganisationId: string, item: ModelsBooking) => {
    await deleteUserBooking(selectedOrganisationId, item.id)
    handleCloseAll()
  }

  const actionAddBookingToFavorites = async (
    selectedOrganisationId: string,
    item: ModelsBooking,
  ) => {
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
  }

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
