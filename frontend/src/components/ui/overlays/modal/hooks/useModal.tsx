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

import { logger } from 'lib/logger'
import { useCallback, useMemo } from 'react'
import { useModalViews, useUIStore } from 'stores/uiStore'

/**
 * Custom hook for managing modal dialogs with Zustand state management.
 * Creates or accesses a modal by ID and provides functions to control its visibility.
 * Optimized for performance by using Zustand selectors.
 *
 * @param modalId - Unique identifier for the modal (e.g., 'BookingAddModal')
 * @returns Object containing:
 *   - modalId: The modal's unique identifier
 *   - openModal: Function to show the modal
 *   - closeModal: Function to hide and remove the modal
 *   - modalViews: Array of all modal states
 *   - isModalOpen: Boolean indicating if this specific modal is open
 *   - addModal: Function to register a new modal in the store
 *
 * @example
 * const { openModal, closeModal, isModalOpen } = useModal('BookingEditModal')
 *
 * // Open the modal
 * openModal()
 *
 * // Check if modal is open
 * if (isModalOpen) {
 *   console.log('Modal is currently visible')
 * }
 *
 * // Close the modal
 * closeModal()
 */
export const useModal = (modalId: string) => {
  // Use Zustand selectors for optimal performance
  const modalViews = useModalViews()
  const addModalAction = useUIStore((state) => state.addModal)
  const setModalOpen = useUIStore((state) => state.setModalOpen)
  const removeModal = useUIStore((state) => state.removeModal)

  const isModalOpen = useMemo(() => {
    const modal = modalViews?.find((m) => m.id === modalId)
    return modal?.isOpen
  }, [modalViews, modalId])

  const addModal = useCallback(
    (open: boolean) => {
      if (!modalViews?.find((m) => m.id === modalId)) {
        addModalAction({
          id: modalId,
          isOpen: open,
        })
      }
    },
    [modalViews, modalId, addModalAction],
  )

  const openModal = useCallback(() => {
    if (!isModalOpen) {
      addModal(true)
      setModalOpen(modalId, true)
    }
  }, [isModalOpen, addModal, setModalOpen, modalId])

  const closeModal = useCallback(() => {
    if (!modalViews?.find((m) => m.id === modalId)) {
      logger.error(`[useModal][closeModal][${modalId}][notExists]`)
    }
    setModalOpen(modalId, false)
    removeModal(modalId)
  }, [modalViews, modalId, setModalOpen, removeModal])

  return { modalId, openModal, closeModal, modalViews, isModalOpen, addModal }
}

export default useModal
