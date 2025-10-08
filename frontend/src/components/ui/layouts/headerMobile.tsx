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

import { BookingCurrent } from 'components/features/user/index/current/bookingCurrent'
import { CalendarWeekResponsive } from 'components/ui/calendar/CalendarWeekResponsive'
import { useRouter } from 'next/router'
import { ROUTES } from 'projectConfig/routes'
import React from 'react'

export const HeaderMobile: React.FC = () => {
  const router = useRouter()
  const showCalendar = router.route === ROUTES.USER.INDEX
  return (
    <section className="flex h-full w-full items-center gap-2 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-hidden">
        {showCalendar ? <CalendarWeekResponsive /> : <BookingCurrent inContainer={false} />}
      </div>
    </section>
  )
}
