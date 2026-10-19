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

import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cn } from '~/lib/utils/cn'

interface DrawerProperties {
  bodyClassName?: string
  children: ReactNode
  closeLabel: string
  /** The portal target. A drawer with form fields portals into the form, so the fields stay in it. */
  container?: HTMLElement
  isOpen: boolean
  /** Keep the content in the DOM while the drawer is closed, for example form fields that the page reads. */
  keepMounted?: boolean
  onOpenChange: (isOpen: boolean) => void
  popupClassName?: string
  testId?: string
  title: ReactNode
}

/** A modal panel that slides in from the right edge of the window. */
export const Drawer = ({
  bodyClassName,
  children,
  closeLabel,
  container,
  isOpen,
  keepMounted = false,
  onOpenChange,
  popupClassName,
  testId,
  title,
}: DrawerProperties) => {
  return (
    <Dialog.Root modal onOpenChange={onOpenChange} open={isOpen}>
      <Dialog.Portal container={container} keepMounted={keepMounted}>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <div className="pointer-events-none fixed inset-y-0 right-0 z-50 flex max-w-full">
          <Dialog.Popup
            className={cn(
              'pointer-events-auto w-screen max-w-[90vw] transition-transform duration-300 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full',
              popupClassName,
            )}
            data-testid={testId}>
            <div className="bg-base-100 flex h-full flex-col shadow-2xl">
              <div className="border-base-300 flex items-center justify-between border-b px-6 py-4">
                <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
                <Dialog.Close
                  render={
                    <Button
                      aria-label={closeLabel}
                      fullWidth={false}
                      shape="circle"
                      size="sm"
                      variant="ghost">
                      <LucideIcon icon={X} size={20} />
                    </Button>
                  }
                />
              </div>
              <div className={cn('min-h-0 flex-1', bodyClassName)}>{children}</div>
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
