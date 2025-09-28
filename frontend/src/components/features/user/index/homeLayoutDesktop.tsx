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

import { BookingDayStatsProgressBar } from 'components/features/user/index/bookingDayStatsProgressBar'
import { BookingCurrent } from 'components/features/user/index/current/bookingCurrent'
import { IndexColumnTabs } from 'components/features/user/index/indexColumnTabs'
import { BookingListSelectedDay } from 'components/features/user/index/list/bookingListSelectedDay'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import React from 'react'

export const HomeLayoutDesktop: React.FC = () => {
  return (
    <>
      <div className="border-base-100 bg-base-100 text-base-content grid h-full w-full grid-rows-[min-content_min-content_auto] gap-1 overflow-auto border-l">
        <BookingDayStatsProgressBar />
        <BookingCurrent />
        <ScrollContainer>
          <BookingListSelectedDay />
        </ScrollContainer>
      </div>
      <div className="border-base-100 bg-base-200 text-base-content flex h-full w-full overflow-auto rounded-tr-xl border-l">
        <IndexColumnTabs />
      </div>
    </>
  )
}
