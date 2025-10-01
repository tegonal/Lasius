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
import { AnimateChange } from 'components/ui/animations/motion/animateChange'
import { SlidingIndicator } from 'components/ui/animations/SlidingIndicator'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { addWeeks, isToday, toDate } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { cn } from 'lib/utils/cn'
import { formatISOLocale, getWeekOfDate } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { useCalendarActions, useSelectedDate } from 'stores/calendarStore'
import { useIsClient } from 'usehooks-ts'

export const CalendarWeekResponsive: React.FC = () => {
  const { t } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const { setSelectedDate } = useCalendarActions()

  const [week, setWeek] = React.useState(getWeekOfDate(formatISOLocale(new Date())))
  const [selectedDay, setSelectedDay] = React.useState(selectedDate || formatISOLocale(new Date()))
  const isClient = useIsClient()
  const dayRefs = React.useRef<(HTMLElement | null)[]>([])

  const getDay = (str: IsoDateString) => {
    return toDate(new Date(str)).getDate()
  }

  useEffect(() => {
    setSelectedDay(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    setWeek(getWeekOfDate(selectedDay))
  }, [selectedDay])

  if (!isClient) return null

  const nextWeek = () => {
    setWeek(getWeekOfDate(addWeeks(new Date(week[0]), 1)))
  }

  const previousWeek = () => {
    setWeek(getWeekOfDate(addWeeks(new Date(week[0]), -1)))
  }

  const handleDayClick = (day: IsoDateString) => {
    setSelectedDay(day)
    setSelectedDate(day)
  }

  const showToday = () => {
    handleDayClick(formatISOLocale(new Date()))
  }

  return (
    <div className="flex min-w-0 items-center justify-center overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-center pt-3">
        <ButtonLeft
          aria-label={t('calendar.navigation.previousWeek', { defaultValue: 'Last week' })}
          onClick={() => previousWeek()}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden md:max-w-[500px]">
        <div className="border-base-content/50 grid min-h-[22px] w-full grid-cols-3 border-b text-sm">
          <div>
            <FormatDate date={week[0]} format="monthNameLong" />
          </div>
          {!isToday(new Date(selectedDay)) ? (
            <Button
              variant="unstyled"
              size="xs"
              aria-label={t('common.time.today', { defaultValue: 'Today' })}
              onClick={() => showToday()}>
              {t('common.time.today', { defaultValue: 'Today' })}
            </Button>
          ) : (
            <div />
          )}
          <div className="text-right">
            <FormatDate date={week[0]} format="year" />
          </div>
        </div>
        <div className="min-h-[82px] w-full overflow-x-auto">
          <div className="relative">
            <AnimateChange hash={week[0]}>
              <div className="grid w-max grid-cols-[repeat(7,62px)] gap-1 sm:gap-2 md:w-full md:grid-cols-[repeat(7,1fr)] lg:gap-3">
                {week.map((day, index) => (
                  <div
                    key={day}
                    ref={(el) => {
                      dayRefs.current[index] = el
                    }}
                    className={cn(
                      'relative',
                      getDay(selectedDay) === getDay(day)
                        ? 'text-neutral-content'
                        : 'text-base-content',
                    )}>
                    <CalendarDay
                      date={day}
                      onClick={() => handleDayClick(day)}
                      isSelected={getDay(selectedDay) === getDay(day)}
                    />
                  </div>
                ))}
              </div>
            </AnimateChange>
            {/* Sliding indicator - outside AnimateChange */}
            <SlidingIndicator
              selectedIndex={week.findIndex((day) => getDay(selectedDay) === getDay(day))}
              itemRefs={dayRefs}
              radiusOn="bottom"
            />
          </div>
        </div>
      </div>
      <div className="flex h-full flex-shrink-0 items-center justify-center pt-3">
        <ButtonRight
          aria-label={t('calendar.navigation.nextWeek', { defaultValue: 'Next week' })}
          onClick={() => nextWeek()}
        />
      </div>
    </div>
  )
}
