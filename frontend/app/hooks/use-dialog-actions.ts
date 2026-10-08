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

import { useCallback, useEffect, useRef, useState } from 'react'

/** The dialog method that makes the open state of the dialog match the expanded state, or null. */
export const getDialogSync = (isExpanded: boolean, isOpen: boolean): 'close' | 'show' | null => {
  if (isExpanded === isOpen) return null
  return isExpanded ? 'show' : 'close'
}

/**
 * Manages dialog expand/collapse with hover, ESC, and click-outside behavior.
 *
 * Used by booking-insert-actions and booking-overlap-actions for their
 * expandable action dialogs.
 */
export const useDialogActions = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const dialogReference = useRef<HTMLDialogElement>(null)

  const isShowExpanded = isHovered || isExpanded

  const handleToggle = useCallback(() => {
    setIsExpanded((previous) => !previous)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
    setIsHovered(false)
  }, [])

  // Sync dialog open/close with isExpanded state
  useEffect(() => {
    const dialog = dialogReference.current
    if (!dialog) return
    const method = getDialogSync(isExpanded, dialog.open)
    if (method) dialog[method]()
  }, [isExpanded])

  // Handle dialog close event (triggered by ESC key)
  useEffect(() => {
    const dialog = dialogReference.current
    if (!dialog) return

    const handleClose = () => {
      setIsExpanded(false)
      setIsHovered(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
    }
  }, [])

  // Handle click outside to close
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!dialogReference.current || dialogReference.current.contains(event.target as Node)) {
        return
      }

      setIsExpanded(false)
      setIsHovered(false)
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  return {
    collapse,
    dialogRef: dialogReference,
    handleToggle,
    isExpanded,
    isHovered,
    setIsHovered,
    showExpanded: isShowExpanded,
  }
}
