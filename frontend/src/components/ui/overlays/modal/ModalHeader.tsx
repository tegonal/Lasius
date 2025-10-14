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

import { cn } from 'lib/utils/cn'
import React from 'react'

import { ModalHelpButton } from './ModalHelpButton'
import { ModalTitle } from './ModalTitle'

type Props = {
  children: React.ReactNode
  helpKey?: string
  className?: string
}

/**
 * Modal header component that wraps ModalTitle and optional ModalHelpButton
 * Provides consistent layout for modal headers across the app
 *
 * Usage:
 * <ModalHeader helpKey="modal-settings">
 *   Settings
 * </ModalHeader>
 *
 * Or without help button:
 * <ModalHeader>
 *   Settings
 * </ModalHeader>
 */
export const ModalHeader: React.FC<Props> = ({ children, helpKey, className }) => {
  return (
    <div className={cn('mb-2 flex items-center gap-2', className)}>
      <ModalTitle>{children}</ModalTitle>
      {helpKey && <ModalHelpButton helpKey={helpKey} />}
    </div>
  )
}
