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

import { WorkingHoursGrid } from 'components/features/user/workingHours/workingHoursGrid'
import { WorkingHoursRightColumn } from 'components/features/user/workingHours/workingHoursRightColumn'
import { WorkingHoursStats } from 'components/features/user/workingHours/workingHoursStats'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import React from 'react'

export const WorkingHoursLayout: React.FC = () => {
  return (
    <>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <WorkingHoursStats />
        <div className="p-4">
          <WorkingHoursGrid />
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <WorkingHoursRightColumn />
      </ScrollContainer>
    </>
  )
}
