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

import { format } from 'date-fns'
import { type Locale } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// useCalendarMonth returns the weekday labels from Monday to Sunday.
// A narrow label repeats (T, S), so the column key comes from this list.
const WEEKDAY_IDS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

type Properties = {
  locale: Locale
  onNextMonth: () => void
  onPreviousMonth: () => void
  onToday: () => void
  showTodayButton: boolean
  // Gives the buttons the test IDs `<prefix>-prev-btn`, `<prefix>-next-btn` and `<prefix>-today-btn`.
  testIdPrefix?: string
  viewDate: Date
  weekDays: string[]
}

/** The month navigation, the "Today" button and the weekday row of a month calendar. */
export const CalendarMonthHeader = ({
  locale,
  onNextMonth,
  onPreviousMonth,
  onToday,
  showTodayButton,
  testIdPrefix,
  viewDate,
  weekDays,
}: Properties) => {
  const { t } = useTranslation('common')
  const testId = (name: string) => (testIdPrefix ? `${testIdPrefix}-${name}` : undefined)

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button
          aria-label={t('calendar.navigation.previousMonth', 'Previous month')}
          className="btn btn-ghost btn-sm btn-circle"
          data-testid={testId('prev-btn')}
          onClick={onPreviousMonth}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium">{format(viewDate, 'MMMM', { locale })}</div>
          <div className="text-base-content/60 text-xs">{format(viewDate, 'yyyy')}</div>
        </div>
        <button
          aria-label={t('calendar.navigation.nextMonth', 'Next month')}
          className="btn btn-ghost btn-sm btn-circle"
          data-testid={testId('next-btn')}
          onClick={onNextMonth}>
          <ChevronRight size={16} />
        </button>
      </div>

      {showTodayButton && (
        <div className="mb-2 flex justify-center">
          <button
            aria-label={t('time.today', 'Today')}
            className="btn btn-ghost btn-xs"
            data-testid={testId('today-btn')}
            onClick={onToday}>
            {t('time.today', 'Today')}
          </button>
        </div>
      )}

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_IDS.map((weekdayId, index) => (
          <div className="text-base-content/60 text-xs font-medium" key={weekdayId}>
            {weekDays[index]}
          </div>
        ))}
      </div>
    </>
  )
}
