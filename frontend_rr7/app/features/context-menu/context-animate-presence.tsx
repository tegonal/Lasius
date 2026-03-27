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

import { Popover } from '@base-ui/react/popover'
import { useEffect, useRef, useState } from 'react'

import { cn } from '~/lib/utils/cn'

type Props = {
  children: React.ReactNode
  /** Render the portal inside the nearest modal dialog instead of document.body.
   * Required when used inside a Base UI Dialog with modal={true}, because the
   * default portal target is outside the dialog's focus trap. */
  inModal?: boolean
  variant?: 'compact' | 'default'
}

const positionerClassName = {
  compact: 'translate-x-1',
  default: 'translate-x-1.5 md:translate-x-3.5',
}

/** Allow overflow for shadow + rounded corners, limit right overflow to clip the slide animation */
const clipStyle = {
  compact: { clipPath: 'inset(-1rem -0.75rem -1rem -1rem)' },
  default: { clipPath: 'inset(-1rem -0.25rem -1rem -1rem)' },
}

export const ContextAnimatePresence = ({
  children,
  inModal = false,
  variant = 'default',
}: Props) => {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [modalContainer, setModalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (inModal && anchorRef.current) {
      const dialog = anchorRef.current.closest('[role="dialog"]')
      if (dialog instanceof HTMLElement) {
        setModalContainer(dialog)
      }
    }
  }, [inModal])

  return (
    <>
      {inModal && <span className="hidden" ref={anchorRef} />}
      <Popover.Portal container={modalContainer ?? undefined}>
        <Popover.Positioner
          align="center"
          className={cn(positionerClassName[variant])}
          side="left"
          sideOffset={(data) => -data.anchor.width}
          style={clipStyle[variant]}
        >
          <Popover.Popup className="translate-x-0 transition-[translate] duration-200 ease-in-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </>
  )
}
