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

/**
 * Manages dialog expand/collapse with hover, ESC, and click-outside behavior.
 *
 * Used by booking-insert-actions and booking-overlap-actions for their
 * expandable action dialogs.
 */
export const useDialogActions = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const showExpanded = isHovered || isExpanded

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
    setIsHovered(false)
  }, [])

  // Sync dialog open/close with isExpanded state
  useEffect(() => {
    if (isExpanded && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.show()
    } else if (!isExpanded && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [isExpanded])

  // Handle dialog close event (triggered by ESC key)
  useEffect(() => {
    const dialog = dialogRef.current
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
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false)
        setIsHovered(false)
      }
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
    dialogRef,
    handleToggle,
    isExpanded,
    isHovered,
    setIsHovered,
    showExpanded,
  }
}
