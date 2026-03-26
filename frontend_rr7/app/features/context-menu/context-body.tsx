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
import { cva, type VariantProps } from 'class-variance-authority'
import { useCallback } from 'react'

import { cn } from '~/lib/utils/cn'

import { useContextMenu } from './hooks/use-context-menu'

const contextBodyVariants = cva('flex items-center', {
  defaultVariants: { variant: 'default' },
  variants: {
    variant: {
      compact: 'relative h-full justify-center',
      default: '',
    },
  },
})

type Props = VariantProps<typeof contextBodyVariants> & {
  children: React.ReactNode
  hash: string
}

export const ContextBody = ({ children, hash, variant = 'default' }: Props) => {
  const { currentOpenContextMenuId, handleCloseAll, handleOpenContextMenu } =
    useContextMenu()
  const isOpen = currentOpenContextMenuId === hash

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        handleOpenContextMenu(hash)
      } else {
        handleCloseAll()
      }
    },
    [hash, handleCloseAll, handleOpenContextMenu],
  )

  return (
    <Popover.Root onOpenChange={handleOpenChange} open={isOpen}>
      <div className={cn(contextBodyVariants({ variant }))}>{children}</div>
    </Popover.Root>
  )
}
