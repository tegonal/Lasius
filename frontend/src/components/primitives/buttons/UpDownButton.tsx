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

import { Icon } from 'components/ui/icons/Icon'
import { cn } from 'lib/utils/cn'
import React from 'react'
import { IconNames } from 'types/iconNames'

type Props = {
  onClick: React.MouseEventHandler<HTMLDivElement>
  sx?: any
  direction: 'up' | 'down'
  className?: string
}

export const UpDownButton: React.FC<Props> = ({ onClick, direction, className }) => {
  const iconNames: Record<typeof direction, IconNames> = {
    up: 'arrow-up-1-arrows-diagrams',
    down: 'arrow-down-1-arrows-diagrams',
  }
  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={onClick}
        className="btn btn-ghost btn-square cursor-pointer px-0 py-[5px] opacity-60 hover:opacity-100">
        <Icon name={iconNames[direction]} size={16} />
      </div>
    </div>
  )
}
