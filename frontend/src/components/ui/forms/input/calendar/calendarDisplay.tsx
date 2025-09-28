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
import { ButtonLeft } from 'components/primitives/buttons/ButtonLeft'
import { ButtonRight } from 'components/primitives/buttons/ButtonRight'
import { AnimateChange } from 'components/ui/animations/motion/animateChange'
import { SelectedTabStatic } from 'components/ui/animations/motion/selectedTabStatic'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { CalendarDayCompact } from 'components/ui/forms/input/calendar/calendarDayCompact'
import { addMonths, intervalToDuration, setHours, setMinutes, startOfWeek, toDate } from 'date-fns'
import { uniqueId } from 'es-toolkit/compat'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { cn } from 'lib/utils/cn'
import { formatISOLocale, getMonthOfDate, getWeekOfDate } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

type Props = {
  onChange: (date: IsoDateString) => void
  value: IsoDateString
}
export const CalendarDisplay: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation('common')
  const [referenceDay, setReferenceDay] = useState<IsoDateString>(formatISOLocale(new Date()))
  const [selectedDay, setSelectedDay] = useState<IsoDateString>(referenceDay)
  const [currentMonth, setCurrentMonth] = useState<IsoDateString[]>(getMonthOfDate(referenceDay))
  const [firstDayOfMonth, setFirstDayOfMonth] = useState<Date>(new Date(currentMonth[0]))
  const [topFiller, setTopFiller] = useState<any[]>([])
  const [originalTime, setOrignalTime] = useState<number[]>([0])

  useEffect(() => {
    if (value) {
      setReferenceDay(value)
      setSelectedDay(value)
      setOrignalTime([new Date(value).getHours(), new Date(value).getMinutes()])
    }
  }, [value])

  const getDay = (str: IsoDateString) => {
    return toDate(new Date(str)).getDate()
  }

  const nextMonth = () => {
    setReferenceDay(formatISOLocale(addMonths(new Date(referenceDay), 1)))
  }

  const previousMonth = () => {
    setReferenceDay(formatISOLocale(addMonths(new Date(referenceDay), -1)))
  }

  const showToday = () => {
    setReferenceDay(formatISOLocale(new Date()))
    setSelectedDay(referenceDay)
  }

  useEffect(() => {
    setCurrentMonth(getMonthOfDate(referenceDay))
  }, [referenceDay])

  useEffect(() => {
    setFirstDayOfMonth(new Date(currentMonth[0]))
  }, [currentMonth, currentMonth.length])

  useEffect(() => {
    const filler = intervalToDuration({
      start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
      end: firstDayOfMonth,
    }).days
    setTopFiller(new Array(filler).fill(() => uniqueId(), 0, filler))
  }, [firstDayOfMonth])

  const handleChange = (date: IsoDateString) => {
    const dateObj = new Date(date)
    onChange(formatISOLocale(setMinutes(setHours(dateObj, originalTime[0]), originalTime[1])))
  }

  return (
    <div className="text-base-content grid grid-cols-[48px_auto_48px] gap-1 select-none">
      <div className="pt-3">
        <ButtonLeft
          aria-label={t('calendar.navigation.previousMonth', { defaultValue: 'Previous month' })}
          onClick={() => previousMonth()}
        />
      </div>
      <div className="w-full">
        <div className="border-base-content/20 flex items-center justify-between border-b text-sm">
          <div className="flex items-center justify-center">
            <FormatDate date={firstDayOfMonth} format="monthNameLong" />
          </div>
          <div>
            <Button
              variant="unstyled"
              size="xs"
              aria-label={t('common.time.today', { defaultValue: 'Today' })}
              onClick={() => showToday()}
              fullWidth={false}>
              {t('common.time.today', { defaultValue: 'Today' })}
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <FormatDate date={firstDayOfMonth} format="year" />
          </div>
        </div>
        <AnimateChange hash={referenceDay}>
          <div className="grid w-full grid-cols-7 justify-stretch gap-1 px-1">
            {getWeekOfDate(selectedDay).map((week) => (
              <div
                key={`weekday-${week}`}
                className="py-1 text-center text-[8px] leading-normal font-medium uppercase">
                <FormatDate date={week} format="dayNameShort" />
              </div>
            ))}
          </div>
          <div className="grid w-full grid-cols-7 justify-stretch gap-1 px-1">
            {topFiller.map((item) => (
              <div key={item()} />
            ))}
            {currentMonth.map((day) => (
              <div
                key={`day${day}`}
                className={cn(
                  'relative h-full w-full flex-grow',
                  getDay(selectedDay) === getDay(day) ? 'text-white' : 'text-current',
                )}>
                {getDay(selectedDay) === getDay(day) && <SelectedTabStatic radiusOn="all" />}
                <CalendarDayCompact date={day} onClick={() => handleChange(day)} />
              </div>
            ))}
          </div>
        </AnimateChange>
      </div>
      <div className="pt-3">
        <ButtonRight
          aria-label={t('calendar.navigation.nextMonth', { defaultValue: 'Next month' })}
          onClick={() => nextMonth()}
        />
      </div>
    </div>
  )
}
