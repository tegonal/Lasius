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

import { Dialog, DialogBackdrop, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { m } from 'framer-motion'
import { cn } from 'lib/utils/cn'
import React, { Fragment } from 'react'

const modalContainerVariants = cva(
  'bg-base-100 text-base-content mx-2 rounded-lg p-6 shadow-lg md:mx-0 md:p-8',
  {
    variants: {
      size: {
        default: 'w-full max-w-full md:w-4/5 md:max-w-[500px]',
        wide: 'h-[90vh] w-full max-w-full md:w-4/5 md:max-w-[700px]',
        auto: 'h-auto w-full max-w-full md:w-auto md:max-w-[80%]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

type ModalContainerProps = VariantProps<typeof modalContainerVariants>

type Props = {
  children: React.ReactNode
  open: boolean
  onClose: () => void
  autoSize?: boolean
  minHeight?: string | number
  blockViewport?: boolean
} & ModalContainerProps

/**
 * Modal component using HeadlessUI Dialog
 * Replaces the old ModalResponsive with built-in stack management,
 * focus trapping, and accessibility features
 */
export const Modal: React.FC<Props> = ({
  children,
  open,
  onClose,
  minHeight,
  blockViewport = false,
  autoSize = false,
  size,
}) => {
  const handleClose = () => {
    if (!blockViewport) {
      onClose()
    }
  }

  const modalSize = autoSize ? 'auto' : size || 'default'

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-[5px]" />
        </TransitionChild>

        {/* Modal container */}
        <div className="fixed inset-0 flex items-center justify-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-full"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-full">
            <DialogPanel
              as={m.div}
              className={cn(modalContainerVariants({ size: modalSize }), minHeight && 'h-auto')}
              style={{ minHeight: minHeight || undefined }}>
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
