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

type Props = {
  radiusOn: 'top' | 'right' | 'bottom' | 'left' | 'all'
}

export const SelectedTabStatic: React.FC<Props> = ({ radiusOn }) => {
  const radiusClasses = {
    top: 'rounded-t-md',
    right: 'rounded-r-md',
    bottom: 'rounded-b-md',
    left: 'rounded-l-md',
    all: 'rounded-md',
  }

  return (
    <div
      className={cn(
        'bg-red-gradient absolute top-0 right-0 left-0 z-[1] h-full',
        radiusClasses[radiusOn],
      )}
    />
  )
}
