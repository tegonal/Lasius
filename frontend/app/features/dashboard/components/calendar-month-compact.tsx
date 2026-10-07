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

import { addMonths, format, isSameDay, isToday, parseISO, startOfMonth, subMonths } from 'date-fns'
import { type Locale } from 'date-fns/locale'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CalendarMonthHeader } from '~/components/ui/forms/input/calendar/calendar-month-header'
import { useCalendarDaySummary } from '~/features/calendar/hooks/use-calendar-day-summary'
import { useCalendarMonth } from '~/features/calendar/hooks/use-calendar-month'
import { cn } from '~/lib/utils/cn'
import { getDateLocale } from '~/lib/utils/date-locale'
import { formatISOLocale, type IsoDateString, toCalendarDay } from '~/lib/utils/dates'

type CalendarDayCompactProperties = {
  day: IsoDateString
  isSelected: boolean
  isTodayDate: boolean
  locale: Locale
  onDayClick: (day: IsoDateString) => void
}

const CalendarDayCompact = ({
  day,
  isSelected,
  isTodayDate,
  locale,
  onDayClick,
}: CalendarDayCompactProperties) => {
  const { progressBarPercentage } = useCalendarDaySummary(day)
  const dayDate = parseISO(day)

  return (
    <button
      aria-label={format(dayDate, 'PPP', { locale })}
      className={cn(
        'relative flex h-8 w-full cursor-pointer items-center justify-center overflow-hidden rounded text-sm transition-colors',
        isSelected && 'bg-secondary text-secondary-content',
        !isSelected && 'hover:bg-base-200',
        isTodayDate && !isSelected && 'text-secondary font-bold',
      )}
      data-testid={`calendar-day-${day}`}
      onClick={() => onDayClick(day)}>
      {progressBarPercentage > 0 && (
        <div
          className={cn(
            'absolute bottom-0 left-0 w-full transition-all',
            isSelected ? 'bg-secondary-content/40' : 'bg-base-content/25',
          )}
          style={{
            height: `${Math.min(progressBarPercentage, 100)}%`,
          }}
        />
      )}
      <span className="relative z-10">{dayDate.getDate()}</span>
    </button>
  )
}

type Properties = {
  date: string // ISO date string
  onDateChange: (date: string) => void
}

export const CalendarMonthCompact = ({ date, onDateChange }: Properties) => {
  const { i18n } = useTranslation('common')
  const locale = getDateLocale(i18n.language)
  const selectedDate = toCalendarDay(date)

  const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate))
  const { monthDays, startOffset, weekDays } = useCalendarMonth(viewDate)

  const handlePreviousMonth = () => setViewDate((previous) => subMonths(previous, 1))
  const handleNextMonth = () => setViewDate((previous) => addMonths(previous, 1))

  const handleDayClick = (day: IsoDateString) => {
    onDateChange(day)
  }

  const handleToday = () => {
    const today = new Date()
    setViewDate(startOfMonth(today))
    onDateChange(formatISOLocale(today))
  }

  const isShowTodayButton = !isToday(selectedDate)

  return (
    <div className="w-full" data-testid="calendar-month-compact">
      <CalendarMonthHeader
        locale={locale}
        onNextMonth={handleNextMonth}
        onPreviousMonth={handlePreviousMonth}
        onToday={handleToday}
        showTodayButton={isShowTodayButton}
        testIdPrefix="calendar-month"
        viewDate={viewDate}
        weekDays={weekDays}
      />

      <div className="grid w-full grid-cols-7 gap-1">
        {Array.from({ length: startOffset }, (_, index) => (
          <div key={`filler-${index}`} />
        ))}
        {monthDays.map((day) => {
          const isoDay = formatISOLocale(day)
          const isSelected = isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <CalendarDayCompact
              day={isoDay}
              isSelected={isSelected}
              isTodayDate={isTodayDate}
              key={isoDay}
              locale={locale}
              onDayClick={handleDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}
