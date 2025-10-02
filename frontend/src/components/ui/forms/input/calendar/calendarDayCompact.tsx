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

import { Button } from 'components/primitives/buttons/Button'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { isWeekend } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { cn } from 'lib/utils/cn'
import React from 'react'

type Props = {
  date: IsoDateString
  onClick: (args: any) => void
}

export const CalendarDayCompact: React.FC<Props> = ({ date, onClick }) => {
  const day = new Date(date)
  const setDate = () => onClick(date)
  return (
    <Button
      variant="ghost"
      className={cn(
        'relative z-[2] flex h-full w-full flex-grow flex-col items-center justify-center p-2 text-center text-base leading-none',
        isWeekend(day) && 'opacity-50',
      )}
      onClick={() => setDate()}
      fullWidth={false}>
      <FormatDate date={day} format="day" />
    </Button>
  )
}
