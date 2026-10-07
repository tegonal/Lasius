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

import { Combobox } from '@base-ui/react/combobox'
import { type ComponentProps } from 'react'

import { useDialogPortalContainer } from '~/components/ui/overlays/use-dialog-portal-container'
import { cn } from '~/lib/utils/cn'

/** The option list of a Base UI combobox, at the width of its input group. */
export const DropdownList = ({
  children,
  className,
}: {
  children: ComponentProps<typeof Combobox.List>['children']
  className?: string
}) => {
  const { anchorReference, container } = useDialogPortalContainer()

  return (
    <>
      <span className="hidden" ref={anchorReference} />
      <Combobox.Portal container={container}>
        <Combobox.Positioner className="z-50 w-[var(--anchor-width)]" sideOffset={4}>
          <Combobox.Popup
            className={cn(
              'bg-base-100 border-base-content/20 rounded-lg border',
              'h-auto max-h-[240px] w-full overflow-auto py-1',
              'shadow-lg',
              'scrollbar-thumb-base-content/20 scrollbar-thin scrollbar-track-transparent',
              className,
            )}>
            <Combobox.List>{children}</Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </>
  )
}
