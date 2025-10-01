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

import { stringHash } from 'lib/utils/string/stringHash'
import { useCallback } from 'react'
import { useToastViews, useUIStore } from 'stores/uiStore'
import { ToastViewType } from 'types/dynamicViews'

/**
 * Custom hook for managing toast notifications with Zustand state management.
 * Provides functions to add and remove toast messages with automatic deduplication
 * based on content hashing. Optimized for performance with Zustand selectors.
 *
 * @returns Object containing:
 *   - addToast: Function to display a new toast notification (auto-expires in 5s)
 *   - removeToast: Function to manually dismiss a toast
 *   - toastViews: Array of all currently displayed toasts
 *
 * @example
 * const { addToast, removeToast } = useToast()
 *
 * // Show success toast
 * addToast({
 *   message: 'Booking saved successfully',
 *   type: 'SUCCESS'
 * })
 *
 * // Show error toast
 * addToast({
 *   message: 'Failed to save booking',
 *   type: 'ERROR'
 * })
 *
 * @remarks
 * Toasts are automatically deduplicated - identical messages won't create duplicate toasts.
 * Default TTL is 5000ms (5 seconds).
 */
export const useToast = () => {
  // Use Zustand selectors for optimal performance
  const toastViews = useToastViews()
  const addToastAction = useUIStore((state) => state.addToast)
  const removeToastAction = useUIStore((state) => state.removeToast)

  const addToast = useCallback(
    (item: Omit<ToastViewType, 'id'>) => {
      const itemHash = stringHash(item)
      if (!toastViews?.find((m) => m.id === itemHash)) {
        addToastAction({
          id: itemHash,
          ttl: 5000,
          ...item,
        })
      }
    },
    [toastViews, addToastAction],
  )

  const removeToast = useCallback(
    (item: ToastViewType) => {
      if (toastViews?.find((m) => m.id === item.id)) {
        removeToastAction(item.id)
      }
    },
    [toastViews, removeToastAction],
  )

  return { addToast, removeToast, toastViews }
}
