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

import { cva, type VariantProps } from 'class-variance-authority'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { Portal } from 'components/ui/overlays/Portal'
import { AnimatePresence, m } from 'framer-motion'
import { cn } from 'lib/utils/cn'
import React from 'react'
import { useEventListener } from 'usehooks-ts'

const overlayVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      duration: 0.3,
      delayChildren: 0.4,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: 'afterChildren',
      duration: 0.3,
      delay: 0.4,
    },
  },
}

const modalContainerVariants = cva(
  'bg-base-100 text-base-content mx-2 rounded-lg p-6 shadow-lg md:mx-0 md:p-8',
  {
    variants: {
      size: {
        default: 'w-full max-w-full md:w-4/5 md:max-w-[500px]',
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
  open?: boolean
  autoSize?: boolean
  minHeight?: string | number
  modalId: string
  blockViewport?: boolean
} & ModalContainerProps

export const ModalResponsive: React.FC<Props> = ({
  children,
  modalId = '',
  minHeight,
  blockViewport = false,
  autoSize = false,
}) => {
  const { closeModal, modalViews, isModalOpen } = useModal(modalId)

  const closeThis = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (blockViewport) return
    if ((e.target as HTMLDivElement).id === modalId) {
      closeModal()
    }
  }

  const handleEscape = (e: KeyboardEvent) => {
    if (blockViewport) return
    // Only listen to Escape when there are modals in the stack
    if (modalViews.length === 0) return
    if (e.key === 'Escape') {
      const latestModal = modalViews.pop()
      if (latestModal?.id === modalId) {
        closeModal()
      }
    }
  }

  useEventListener('keydown', handleEscape)

  return (
    <Portal selector="#modal">
      <AnimatePresence>
        {isModalOpen && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[5px]"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            onClick={(e) => closeThis(e)}
            id={modalId}>
            <m.div
              className={cn(
                modalContainerVariants({ size: autoSize ? 'auto' : 'default' }),
                minHeight && 'h-auto',
              )}
              style={{ minHeight: minHeight || undefined }}
              initial={{ opacity: 0, y: '100vh' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100vh' }}
              transition={{ ease: 'easeInOut', duration: 0.3 }}>
              {children}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}
