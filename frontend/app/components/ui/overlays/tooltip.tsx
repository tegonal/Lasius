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

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { type ReactElement, type ReactNode } from 'react'

interface TooltipProperties {
  /** The trigger element. It must accept a ref and spread the props it receives. */
  children: ReactElement
  label: ReactNode
  side?: 'bottom' | 'left' | 'right' | 'top'
}

/** Wrap a group of tooltips in TooltipProvider, so a neighbour tooltip opens without delay. */
export const TooltipProvider = BaseTooltip.Provider

export const Tooltip = ({ children, label, side = 'top' }: TooltipProperties) => {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className="z-[100]" side={side} sideOffset={8}>
          <BaseTooltip.Popup className="bg-neutral text-neutral-content rounded-box px-3 py-1.5 text-sm shadow-lg transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
