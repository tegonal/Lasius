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

import { CalendarDay } from 'components/features/calendar/calendarDay'
import { Button } from 'components/primitives/buttons/Button'
import { ButtonLeft } from 'components/primitives/buttons/ButtonLeft'
import { ButtonRight } from 'components/primitives/buttons/ButtonRight'
import { SelectedTabIcon } from 'components/ui/animations/motion/selectedTabIcon'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { addMonths, intervalToDuration, isToday, startOfWeek, toDate } from 'date-fns'
import { uniqueId } from 'es-toolkit/compat'
import { AnimatePresence, m } from 'framer-motion'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { cn } from 'lib/utils/cn'
import { formatISOLocale, getMonthOfDate } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { useCalendarActions, useSelectedDate } from 'stores/calendarStore'
import { useIsClient } from 'usehooks-ts'

export const CalendarMonth: React.FC = () => {
  const { t } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const { setSelectedDate } = useCalendarActions()
  const isClient = useIsClient()

  const [month, setMonth] = React.useState(getMonthOfDate(selectedDate))
  const [selectedDay, setSelectedDay] = React.useState(selectedDate)

  useEffect(() => {
    setMonth(getMonthOfDate(selectedDay))
  }, [selectedDay])

  const getDay = (str: IsoDateString) => {
    return toDate(new Date(str)).getDate()
  }

  const nextMonth = () => {
    setMonth(getMonthOfDate(addMonths(new Date(month[0]), 1)))
  }

  const previousMonth = () => {
    setMonth(getMonthOfDate(addMonths(new Date(month[0]), -1)))
  }

  const showToday = () => {
    setSelectedDay(formatISOLocale(new Date()))
  }

  const handleDayClick = (day: IsoDateString) => {
    setSelectedDay(day)
    setSelectedDate(day)
  }

  const topFiller = () => {
    const firstDayOfMonth = new Date(month[0])
    const filler =
      intervalToDuration({
        start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
        end: firstDayOfMonth,
      }).days || 0
    return new Array(filler).fill(() => uniqueId(), 0, filler)
  }

  if (!isClient) return null

  return (
    <div className="flex w-full items-start justify-center">
      <div className="h-full pt-3">
        <ButtonLeft
          aria-label={t('calendar.navigation.previousMonth', { defaultValue: 'Previous month' })}
          onClick={() => previousMonth()}
        />
      </div>
      <div className="w-full max-w-xl">
        <div className="border-base-content/50 mb-3 flex justify-between border-b text-base">
          <div className="flex items-center justify-center">
            <FormatDate date={month[0]} format="monthNameLong" />
          </div>
          <div className="overflow-hidden">
            {!isToday(new Date(selectedDay)) && (
              <Button
                variant="unstyled"
                size="xs"
                fullWidth={false}
                aria-label={t('common.time.today', { defaultValue: 'Today' })}
                onClick={() => showToday()}>
                {t('common.time.today', { defaultValue: 'Today' })}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-center">
            <FormatDate date={month[0]} format="year" />
          </div>
        </div>
        <AnimatePresence>
          <div className="grid w-full grid-cols-7 justify-stretch gap-3 px-3 pt-0 sm:pt-1 lg:pt-3">
            {topFiller().map((item) => (
              <div key={item()} />
            ))}
            {month.map((day) => (
              <m.div
                key={day}
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}>
                <div
                  className={cn(
                    'relative grow',
                    getDay(selectedDay) === getDay(day)
                      ? 'text-neutral-content'
                      : 'text-base-content',
                  )}>
                  {getDay(selectedDay) === getDay(day) && (
                    <SelectedTabIcon layoutId="calendarMonth" radiusOn="all" />
                  )}
                  <CalendarDay date={day} onClick={() => handleDayClick(day)} />
                </div>
              </m.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
      <div className="h-full pt-3">
        <ButtonRight
          aria-label={t('calendar.navigation.nextMonth', { defaultValue: 'Next month' })}
          onClick={() => nextMonth()}
        />
      </div>
    </div>
  )
}
