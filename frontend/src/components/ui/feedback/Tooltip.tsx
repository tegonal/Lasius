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

import { Popover, PopoverPanel } from '@headlessui/react'
import { Badge } from 'components/ui/data-display/Badge'
import { cn } from 'lib/utils/cn'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
import { useBoolean, useHover } from 'usehooks-ts'

type WidthVariant = 'auto' | 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  children: React.ReactNode | string
  toolTipContent: React.ReactNode | string
  offset?: number
  placement?: 'top' | 'bottom' | 'left' | 'right'
  width?: WidthVariant
}

/**
 * Tooltip component: Wraps a child component and displays a tooltip with {label} when hovering over the child.
 * @param children
 * @param toolTipContent
 * @param offset
 * @param placement
 */
export const ToolTip: React.FC<Props> = ({
  children,
  toolTipContent,
  offset = 8,
  placement = 'top',
  width = 'auto',
}) => {
  const visible = useBoolean(false)

  const [referenceElement, setReferenceElement] = useState()
  const [popperElement, setPopperElement] = useState()

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      { name: 'offset', options: { offset: [0, offset] } },
      {
        name: 'preventOverflow',
        options: {
          altAxis: true,
          padding: 5,
          altBoundary: true,
        },
      },
    ],
  })

  const hoverRef = useRef(null)
  // @ts-expect-error React 19 type compatibility, nullable ref can be ignored.
  // see https://github.com/juliencrn/usehooks-ts/issues/602
  const isHover = useHover(hoverRef)

  useEffect(() => {
    if (isHover) {
      visible.setTrue()
    } else {
      visible.setFalse()
    }
  }, [isHover, visible])

  const widthClasses = {
    auto: '',
    sm: 'w-32',
    md: 'w-48',
    lg: 'w-64',
    xl: 'w-80',
  }

  return (
    <div className="hover:cursor-pointer" ref={hoverRef}>
      <Popover>
        <div ref={setReferenceElement as any} onClick={visible.toggle}>
          {children}
        </div>
        {visible.value && (
          <PopoverPanel
            static
            as="div"
            ref={setPopperElement as any}
            style={{ ...styles.popper, zIndex: 9 }}
            {...attributes.popper}>
            {({ close }) => (
              <Badge variant="tooltip" onClick={() => close()} className={cn(widthClasses[width])}>
                {toolTipContent}
              </Badge>
            )}
          </PopoverPanel>
        )}
      </Popover>
    </div>
  )
}
