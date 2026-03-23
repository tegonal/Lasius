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

import React, { useCallback, useRef } from 'react'

/**
 * Restores cursor position in a focused input after value changes.
 *
 * Used by segmented time/duration inputs where programmatic value updates
 * would otherwise reset the cursor to the end of the input.
 *
 * Returns a setter function to schedule cursor restoration before updating inputValue.
 */
export function useRestoreCursorPosition(
  inputRef: React.RefObject<HTMLInputElement | null>,
  inputValue: string,
) {
  const pendingCursorPosRef = useRef<null | number>(null)

  React.useLayoutEffect(() => {
    if (
      pendingCursorPosRef.current !== null &&
      inputRef.current?.matches(':focus')
    ) {
      const pos = pendingCursorPosRef.current
      pendingCursorPosRef.current = null
      inputRef.current.setSelectionRange(pos, pos)
    }
  }, [inputValue, inputRef])

  const setCursorPosition = useCallback((pos: number) => {
    pendingCursorPosRef.current = pos
  }, [])

  return setCursorPosition
}
