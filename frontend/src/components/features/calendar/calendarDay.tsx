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

import { DotRed } from 'components/ui/data-display/dots/dotRed'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { ProgressBarSmall } from 'components/ui/data-display/ProgressBarSmall'
import { isToday, isWeekend } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { useGetBookingSummaryDay } from 'lib/api/hooks/useGetBookingSummaryDay'
import { cn } from 'lib/utils/cn'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

type Props = {
  date: IsoDateString
  onClick: (args: any) => void
  isSelected?: boolean
}

export const CalendarDay: React.FC<Props> = ({ date, onClick, isSelected = false }) => {
  const isClient = useIsClient()
  const day = new Date(date)

  const { progressBarPercentage } = useGetBookingSummaryDay(date)

  if (!isClient) return null

  const handleDayClick = () => onClick(date)

  return (
    <button
      className={cn(
        'btn btn-ghost relative z-[2] flex min-h-[78px] w-full min-w-[56px] grow flex-col items-center justify-start text-center',
        isWeekend(day) && 'opacity-50',
        isSelected && 'hover:bg-transparent hover:text-current',
      )}
      onClick={handleDayClick}>
      <div className="pt-1 text-center text-xs leading-none font-normal uppercase">
        <FormatDate date={day} format="dayNameShort" />
      </div>
      <div className="text-2xl leading-none font-normal">
        <FormatDate date={day} format="dayPadded" />{' '}
      </div>
      {progressBarPercentage > 0 && (
        <div className="flex w-full justify-center pb-2">
          <ProgressBarSmall percentage={progressBarPercentage} />
        </div>
      )}
      {isToday(day) && (
        <div className="flex w-full justify-center pb-1">
          <DotRed />
        </div>
      )}
    </button>
  )
}
