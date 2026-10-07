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

import {
  addMonths,
  format,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CalendarMonthHeader } from '~/components/ui/forms/input/calendar/calendar-month-header'
import { useCalendarMonth } from '~/features/calendar/hooks/use-calendar-month'
import { cn } from '~/lib/utils/cn'
import { getDateLocale } from '~/lib/utils/date-locale'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

type CalendarDisplayProperties = {
  onChange: (date: IsoDateString) => void
  value: IsoDateString
}

const getTimeOfDay = (date: Date) => [date.getHours(), date.getMinutes()]

export const CalendarDisplay = ({ onChange, value }: CalendarDisplayProperties) => {
  const { i18n } = useTranslation('common')
  const locale = getDateLocale(i18n.language)
  const selectedDate = new Date(value)
  const [originalTime, setOriginalTime] = useState<number[]>(() =>
    value ? getTimeOfDay(new Date(value)) : [0, 0],
  )

  const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate))
  const { monthDays, startOffset, weekDays } = useCalendarMonth(viewDate)

  // Store the original time and show its month when the value changes
  const [previousValue, setPreviousValue] = useState(value)
  if (value !== previousValue) {
    setPreviousValue(value)
    if (value) {
      const date = new Date(value)
      setOriginalTime(getTimeOfDay(date))
      setViewDate(startOfMonth(date))
    }
  }

  const handlePreviousMonth = () => setViewDate((previous) => subMonths(previous, 1))
  const handleNextMonth = () => setViewDate((previous) => addMonths(previous, 1))

  const handleDayClick = (day: Date) => {
    // Preserve the original time when selecting a new date
    const updatedDate = setMinutes(setHours(day, originalTime[0] ?? 0), originalTime[1] ?? 0)
    onChange(formatISOLocale(updatedDate))
  }

  const handleToday = () => {
    const today = new Date()
    setViewDate(startOfMonth(today))
    const updatedDate = setMinutes(setHours(today, originalTime[0] ?? 0), originalTime[1] ?? 0)
    onChange(formatISOLocale(updatedDate))
  }

  const isShowTodayButton = !isToday(selectedDate)

  return (
    <div className="w-full select-none">
      <CalendarMonthHeader
        locale={locale}
        onNextMonth={handleNextMonth}
        onPreviousMonth={handlePreviousMonth}
        onToday={handleToday}
        showTodayButton={isShowTodayButton}
        viewDate={viewDate}
        weekDays={weekDays}
      />

      <div className="grid w-full grid-cols-7 gap-1">
        {Array.from({ length: startOffset }, (_, index) => (
          <div key={`filler-${index}`} />
        ))}
        {monthDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <button
              aria-label={format(day, 'PPP', { locale })}
              className={cn(
                'flex h-8 w-full cursor-pointer items-center justify-center rounded text-sm transition-colors',
                isSelected && 'bg-secondary text-secondary-content',
                !isSelected && 'hover:bg-base-200',
                isTodayDate && !isSelected && 'text-secondary font-bold',
              )}
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}>
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
