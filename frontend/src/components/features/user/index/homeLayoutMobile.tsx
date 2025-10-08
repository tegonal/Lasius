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

import { BookingAddMobileButton } from 'components/features/user/index/bookingAddMobileButton'
import { BookingDayStatsProgressBar } from 'components/features/user/index/bookingDayStatsProgressBar'
import { BookingCurrent } from 'components/features/user/index/current/bookingCurrent'
import { BookingListSelectedDay } from 'components/features/user/index/list/bookingListSelectedDay'
import { MobileNavigationButton } from 'components/ui/navigation/mobile/mobileNavigationButton'
import React from 'react'

export const HomeLayoutMobile: React.FC = () => {
  return (
    <>
      <section className="bg-base-300 text-base-content relative grid h-full w-full grid-rows-[min-content_min-content_auto] gap-1 overflow-auto rounded-t-xl">
        <BookingCurrent />
        <BookingDayStatsProgressBar />
        <BookingListSelectedDay />
      </section>
      <div className="fixed bottom-4 left-4 z-10">
        <MobileNavigationButton />
      </div>
      <div className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2">
        <BookingAddMobileButton />
      </div>
    </>
  )
}
