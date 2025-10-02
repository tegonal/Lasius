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

import { useCalendarGridOffset } from 'components/features/calendar/hooks/useCalendarGridOffset'
import { useCalendarNavigation } from 'components/features/calendar/hooks/useCalendarNavigation'
import { useCalendarSelection } from 'components/features/calendar/hooks/useCalendarSelection'
import { AnimateChange } from 'components/ui/animations/motion/animateChange'
import { SelectedTabStatic } from 'components/ui/animations/motion/selectedTabStatic'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { CalendarDayCompact } from 'components/ui/forms/input/calendar/calendarDayCompact'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { format, isToday, setHours, setMinutes } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { cn } from 'lib/utils/cn'
import { getDateLocale } from 'lib/utils/date/dateFormat'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  onChange: (date: IsoDateString) => void
  value: IsoDateString
}
export const CalendarDisplay: React.FC<Props> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation('common')
  const [originalTime, setOrignalTime] = useState<number[]>([0, 0])

  const { period: currentMonth, next, previous, goToDate } = useCalendarNavigation(value, 'month')
  const { selectedDay, selectDay, selectToday, isDaySelected } = useCalendarSelection(value, false)
  const topFiller = useCalendarGridOffset(currentMonth[0])

  const weekDays = useMemo(() => {
    const dateLocale = getDateLocale(i18n.language)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2025, 0, 6 + i) // Jan 6, 2025 is a Monday
      return format(date, 'EEEEE', { locale: dateLocale })
    })
  }, [i18n.language])

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setOrignalTime([date.getHours(), date.getMinutes()])
      goToDate(value)
    }
  }, [value, goToDate])

  const handleChange = (date: IsoDateString) => {
    const dateObj = new Date(date)
    const updatedDate = formatISOLocale(
      setMinutes(setHours(dateObj, originalTime[0]), originalTime[1]),
    )
    selectDay(date)
    onChange(updatedDate)
  }

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="btn btn-ghost btn-sm btn-circle"
          aria-label={t('calendar.navigation.previousMonth', { defaultValue: 'Previous month' })}
          onClick={previous}>
          <LucideIcon icon={ChevronLeft} size={16} />
        </button>
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium">
            <FormatDate date={currentMonth[0]} format="monthNameLong" />
          </div>
          <div className="text-base-content/60 text-xs">
            <FormatDate date={currentMonth[0]} format="year" />
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-circle"
          aria-label={t('calendar.navigation.nextMonth', { defaultValue: 'Next month' })}
          onClick={next}>
          <LucideIcon icon={ChevronRight} size={16} />
        </button>
      </div>

      {!isToday(new Date(selectedDay)) && (
        <div className="mb-2 flex justify-center">
          <button
            className="btn btn-ghost btn-xs"
            aria-label={t('common.time.today', { defaultValue: 'Today' })}
            onClick={selectToday}>
            {t('common.time.today', { defaultValue: 'Today' })}
          </button>
        </div>
      )}

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day, index) => (
          <div key={index} className="text-base-content/60 text-xs font-medium">
            {day}
          </div>
        ))}
      </div>

      <AnimateChange hash={currentMonth[0]}>
        <div className="grid w-full grid-cols-7 gap-1">
          {topFiller.map((item) => (
            <div key={item()} />
          ))}
          {currentMonth.map((day) => (
            <div
              key={`day${day}`}
              className={cn(
                'relative h-full w-full flex-grow',
                isDaySelected(day) ? 'text-white' : 'text-current',
              )}>
              {isDaySelected(day) && <SelectedTabStatic radiusOn="all" />}
              <CalendarDayCompact date={day} onClick={() => handleChange(day)} />
            </div>
          ))}
        </div>
      </AnimateChange>
    </div>
  )
}
