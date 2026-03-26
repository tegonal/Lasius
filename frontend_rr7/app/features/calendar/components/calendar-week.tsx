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

import { isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { SlidingIndicator } from '~/components/ui/animations/sliding-indicator'
import { FormatDate } from '~/components/ui/data-display/format-date'
import { CalendarDataProvider } from '~/features/calendar/calendar-data-provider'
import { CalendarDay } from '~/features/calendar/components/calendar-day'
import { useCalendarNavigation } from '~/features/calendar/hooks/use-calendar-navigation'
import { useCalendarSelection } from '~/features/calendar/hooks/use-calendar-selection'
import { usePersistedSearchParam } from '~/hooks/use-persisted-search-param'
import { cn } from '~/lib/utils/cn'
import { formatISOLocale } from '~/lib/utils/dates'

// ─── CalendarWeek ───────────────────────────────────────────────────────────

export const CalendarWeek = ({
  organisationId,
}: {
  organisationId: string
}) => {
  const { t } = useTranslation(['calendar', 'common'])
  const selectedDate = usePersistedSearchParam(
    'date',
    formatISOLocale(new Date()),
  )
  const dayRefs = useRef<(HTMLElement | null)[]>([])

  const {
    next,
    period: week,
    previous,
  } = useCalendarNavigation(selectedDate, 'week')
  const { isDaySelected, selectDay, selectedDay, selectToday } =
    useCalendarSelection(selectedDate)

  return (
    <CalendarDataProvider
      date={selectedDate}
      organisationId={organisationId}
      period="week"
    >
      <div className="flex min-w-0 items-center justify-center overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-center pt-3">
          <ButtonLeft
            aria-label={t('calendar:navigation.previousWeek', 'Previous week')}
            data-testid="calendar-week-prev-btn"
            onClick={previous}
          />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden md:max-w-[500px]">
          <div className="border-base-content/50 grid min-h-[22px] w-full grid-cols-3 border-b text-sm">
            <div>
              {week[0] && <FormatDate date={week[0]} format="monthNameLong" />}
            </div>
            {isToday(new Date(selectedDay)) ? (
              <div />
            ) : (
              <Button
                aria-label={t('time.today', 'Today')}
                data-testid="calendar-week-today-btn"
                onClick={selectToday}
                size="xs"
                variant="unstyled"
              >
                {t('time.today', 'Today')}
              </Button>
            )}
            <div className="text-right">
              {week[0] && <FormatDate date={week[0]} format="year" />}
            </div>
          </div>
          <div className="min-h-[82px] w-full overflow-x-auto">
            <div className="relative">
              {/* TODO: Add AnimateChange wrapper (hash={week[0]}) for month label transitions */}
              <div className="grid w-max grid-cols-[repeat(7,62px)] gap-1 sm:gap-2 md:w-full md:grid-cols-[repeat(7,1fr)] lg:gap-3">
                {week.map((day, index) => (
                  <div
                    className={cn(
                      'relative',
                      isDaySelected(day)
                        ? 'text-neutral-content'
                        : 'text-base-content',
                    )}
                    key={day}
                    ref={(el) => {
                      dayRefs.current[index] = el
                    }}
                  >
                    <CalendarDay
                      date={day}
                      isSelected={isDaySelected(day)}
                      onClick={() => selectDay(day)}
                    />
                  </div>
                ))}
              </div>
              <SlidingIndicator
                itemRefs={dayRefs}
                radiusOn="bottom"
                selectedIndex={week.findIndex((day) => isDaySelected(day))}
              />
            </div>
          </div>
        </div>
        <div className="flex h-full flex-shrink-0 items-center justify-center pt-3">
          <ButtonRight
            aria-label={t('calendar:navigation.nextWeek', 'Next week')}
            data-testid="calendar-week-next-btn"
            onClick={next}
          />
        </div>
      </div>
    </CalendarDataProvider>
  )
}

function ButtonLeft(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button shape="square" size="sm" variant="ghost" {...props}>
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}

// ─── Arrow buttons ──────────────────────────────────────────────────────────

function ButtonRight(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button shape="square" size="sm" variant="ghost" {...props}>
      <ChevronRight className="h-5 w-5" />
    </Button>
  )
}
