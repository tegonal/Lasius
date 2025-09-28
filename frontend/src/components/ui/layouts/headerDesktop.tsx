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

import { LogoutButton } from 'components/features/auth/LogoutButton'
import { BookingCurrent } from 'components/features/user/index/current/bookingCurrent'
import { SelectUserOrganisation } from 'components/features/user/selectUserOrganisation'
import { AnimateChange } from 'components/ui/animations/motion/animateChange'
import { CalendarWeekResponsive } from 'components/ui/calendar/calendarWeekResponsive'
import { Logo } from 'components/ui/icons/Logo'
import { ContainerColumnsHeader } from 'components/ui/layouts/containerColumnsHeader'
import { HelpButton } from 'components/ui/navigation/HelpButton'
import { ColorModeDropdown } from 'components/ui/overlays/ColorModeDropdown'
import { useRouter } from 'next/router'
import { ROUTES } from 'projectConfig/routes'
import React from 'react'

export const HeaderDesktop: React.FC = () => {
  const router = useRouter()
  const showCalendar = router.route === ROUTES.USER.INDEX
  return (
    <section className="h-full w-full overflow-visible">
      <ContainerColumnsHeader>
        <div
          className="hover:text-info flex cursor-pointer items-center justify-start gap-8 pl-8"
          onClick={() => router.push(ROUTES.USER.INDEX)}>
          <Logo />
        </div>
        <AnimateChange hash={showCalendar ? 'calendar' : 'booking'} useAvailableSpace>
          <div className="flex h-full w-full items-center justify-center gap-8">
            {showCalendar ? <CalendarWeekResponsive /> : <BookingCurrent inContainer={false} />}
          </div>
        </AnimateChange>
        <div className="flex items-center justify-end gap-2 pr-8">
          <SelectUserOrganisation />
          <ColorModeDropdown />
          <HelpButton />
          <LogoutButton />
        </div>
      </ContainerColumnsHeader>
    </section>
  )
}
