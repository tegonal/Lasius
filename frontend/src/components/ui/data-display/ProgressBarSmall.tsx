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

import React, { memo } from 'react'

type Props = {
  percentage: number
}

export const ProgressBarSmall: React.FC<Props> = memo(({ percentage }) => {
  return (
    <div className="relative w-full rounded-sm">
      <div className="bg-base-content/30 absolute top-0 left-0 h-1 w-full rounded-sm" />
      <div
        className="bg-base-content h-1 rounded-sm"
        style={{ width: `${percentage <= 100 ? percentage : 100}%` }}
      />
    </div>
  )
})
