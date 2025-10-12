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

import { CalendarDataProvider } from 'components/features/calendar/CalendarDataProvider'
import { useCalendarDaySummary } from 'components/features/calendar/hooks/useCalendarDaySummary'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { format, isToday, toDate } from 'date-fns'
import { AnimatePresence, m } from 'framer-motion'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { cn } from 'lib/utils/cn'
import { getDateLocale } from 'lib/utils/date/dateFormat'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useSelectedDate } from 'stores/calendarStore'
import { useIsClient } from 'usehooks-ts'

import { useCalendarGridOffset } from './hooks/useCalendarGridOffset'
import { useCalendarNavigation } from './hooks/useCalendarNavigation'
import { useCalendarSelection } from './hooks/useCalendarSelection'

type CalendarDayCompactProps = {
  day: IsoDateString
  isSelected: boolean
  isTodayDate: boolean
  onDayClick: (day: IsoDateString) => void
}

const CalendarDayCompact: React.FC<CalendarDayCompactProps> = ({
  day,
  isSelected,
  isTodayDate,
  onDayClick,
}) => {
  const { progressBarPercentage } = useCalendarDaySummary(day)
  const dayDate = new Date(day)
  const dayNumber = toDate(dayDate).getDate()

  return (
    <m.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <button
        className={cn(
          'relative flex h-8 w-full cursor-pointer items-center justify-center overflow-hidden rounded text-sm transition-colors',
          isSelected && 'bg-secondary text-secondary-content',
          !isSelected && 'hover:bg-base-200',
          isTodayDate && !isSelected && 'text-secondary font-bold',
        )}
        onClick={() => onDayClick(day)}
        aria-label={`Select ${dayDate.toLocaleDateString()}`}>
        {progressBarPercentage > 0 && (
          <div
            className={cn(
              'absolute bottom-0 left-0 w-full transition-all',
              isSelected ? 'bg-secondary-content/40' : 'bg-base-content/25',
            )}
            style={{ height: `${progressBarPercentage <= 100 ? progressBarPercentage : 100}%` }}
          />
        )}
        <span className="relative z-10">{dayNumber}</span>
      </button>
    </m.div>
  )
}

export const CalendarMonthCompact: React.FC = () => {
  const { t, i18n } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const isClient = useIsClient()

  const { period: month, next, previous } = useCalendarNavigation(selectedDate, 'month')
  const { selectedDay, selectDay, selectToday, isDaySelected } = useCalendarSelection(
    selectedDate,
    true,
  )
  const topFiller = useCalendarGridOffset(month[0])

  const weekDays = useMemo(() => {
    const dateLocale = getDateLocale(i18n.language)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2025, 0, 6 + i) // Jan 6, 2025 is a Monday
      return format(date, 'EEEEE', { locale: dateLocale })
    })
  }, [i18n.language])

  if (!isClient) return null

  return (
    <CalendarDataProvider date={selectedDate} period="month">
      <div className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <button
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={t('calendar.navigation.previousMonth', { defaultValue: 'Previous month' })}
            onClick={previous}>
            <LucideIcon icon={ChevronLeft} size={16} />
          </button>
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium">
              <FormatDate date={month[0]} format="monthNameLong" />
            </div>
            <div className="text-base-content/60 text-xs">
              <FormatDate date={month[0]} format="year" />
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

        <AnimatePresence>
          <div className="grid w-full grid-cols-7 gap-1">
            {topFiller.map((item) => (
              <div key={item()} />
            ))}
            {month.map((day) => {
              const dayDate = new Date(day)
              const isSelected = isDaySelected(day)
              const isTodayDate = isToday(dayDate)

              return (
                <CalendarDayCompact
                  key={day}
                  day={day}
                  isSelected={isSelected}
                  isTodayDate={isTodayDate}
                  onDayClick={selectDay}
                />
              )
            })}
          </div>
        </AnimatePresence>
      </div>
    </CalendarDataProvider>
  )
}
