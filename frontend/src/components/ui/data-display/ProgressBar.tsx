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

import { ToolTip } from 'components/ui/feedback/Tooltip'
import React, { memo } from 'react'

export const ProgressBar: React.FC<{ percentage: number; label: string }> = memo(
  ({ percentage, label }) => {
    return (
      <div className="w-full">
        <ToolTip toolTipContent={label}>
          <div className="bg-base-content/25 h-[5px] w-full overflow-hidden text-[10px]">
            <div
              className="bg-base-content/75 h-full max-w-full transition-[width] duration-1000 ease-in-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </ToolTip>
      </div>
    )
  },
)
