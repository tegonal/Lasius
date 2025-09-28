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

import { MarkSubString } from 'components/ui/data-display/MarkSubString'
import { cn } from 'lib/utils/cn'
import React from 'react'

type Props = {
  prependString?: string
  itemValue: string
  itemSearchString: string
  active: boolean
  selected: boolean
}

export const DropdownListItem: React.FC<Props> = ({
  prependString = '',
  itemSearchString,
  itemValue,
  active,
  selected,
}) => {
  return (
    <div
      className={cn(
        'text-base-content px-3 py-2 text-sm hover:cursor-pointer',
        'transition-colors duration-150',
        active && 'bg-primary text-primary-content',
        selected && !active && 'bg-base-200',
        !active && !selected && 'hover:bg-base-200',
      )}>
      {prependString}
      <MarkSubString str={itemValue} substr={itemSearchString} />
    </div>
  )
}
