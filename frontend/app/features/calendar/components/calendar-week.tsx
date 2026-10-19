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
import { type AnimationEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { SlidingIndicator } from '~/components/ui/animations/sliding-indicator'
import { FormatDate } from '~/components/ui/data-display/format-date'
import { CalendarDay } from '~/features/calendar/components/calendar-day'
import { useCalendarNavigation } from '~/features/calendar/hooks/use-calendar-navigation'
import { useCalendarSelection } from '~/features/calendar/hooks/use-calendar-selection'
import { useWeekSlide, type WeekSlide } from '~/features/calendar/hooks/use-week-slide'
import { usePersistedSearchParameter } from '~/hooks/use-persisted-search-parameter'
import { useToday } from '~/hooks/use-today'
import { cn } from '~/lib/utils/cn'
import { type IsoDateString, toCalendarDay } from '~/lib/utils/dates'

// ─── CalendarWeek ───────────────────────────────────────────────────────────

const dayGridClasses =
  'grid w-max grid-cols-[repeat(7,62px)] gap-1 sm:gap-2 md:w-full md:grid-cols-[repeat(7,1fr)] lg:gap-3'

const panelClasses = 'relative min-w-full shrink-0'

/** Reads its bookings from the CalendarDataProvider that app-layout.tsx places around both headers. */
export const CalendarWeek = () => {
  const { t } = useTranslation(['calendar', 'common'])
  const selectedDate = usePersistedSearchParameter('date', useToday())

  const { next, period: week, previous } = useCalendarNavigation(selectedDate, 'week')
  const { isDaySelected, selectDay, selectedDay, selectToday } = useCalendarSelection(selectedDate)
  const { endSlide, slide } = useWeekSlide(week)

  const outgoingPanel = slide && <OutgoingWeekPanel slide={slide} />

  return (
    <div className="flex w-full min-w-0 items-center justify-center overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-center pt-3">
        <ButtonLeft
          aria-label={t('calendar:navigation.previousWeek', 'Previous week')}
          data-testid="calendar-week-prev-btn"
          onClick={previous}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden md:max-w-[500px]">
        <WeekHeaderRow onSelectToday={selectToday} selectedDay={selectedDay} weekStart={week[0]} />
        {/* The scroll container clips during a slide, so the outgoing week adds no scrollbar. */}
        <div className={cn('min-h-[82px] w-full', slide ? 'overflow-x-hidden' : 'overflow-x-auto')}>
          <div className="flex">
            {slide?.direction === 'next' && outgoingPanel}
            <CurrentWeekPanel
              animationClass={slide?.animationClass}
              isDaySelected={isDaySelected}
              key={week[0]}
              onAnimationEnd={endSlide}
              onSelectDay={selectDay}
              week={week}
            />
            {slide?.direction === 'previous' && outgoingPanel}
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
  )
}

// ─── Week header row ────────────────────────────────────────────────────────

interface WeekHeaderRowProperties {
  onSelectToday: () => void
  selectedDay: IsoDateString
  weekStart?: IsoDateString
}

/** The month, the Today button and the year above the days. */
const WeekHeaderRow = ({ onSelectToday, selectedDay, weekStart }: WeekHeaderRowProperties) => {
  const { t } = useTranslation('common')

  return (
    <div className="border-base-content/50 grid min-h-[22px] w-full grid-cols-3 border-b text-sm">
      <div>{weekStart && <FormatDate date={weekStart} format="monthNameLong" />}</div>
      {isToday(toCalendarDay(selectedDay)) ? (
        <div />
      ) : (
        <Button
          aria-label={t('time.today', 'Today')}
          data-testid="calendar-week-today-btn"
          onClick={onSelectToday}
          size="xs"
          variant="unstyled">
          {t('time.today', 'Today')}
        </Button>
      )}
      <div className="text-right">{weekStart && <FormatDate date={weekStart} format="year" />}</div>
    </div>
  )
}

// ─── Week panels ────────────────────────────────────────────────────────────

interface CurrentWeekPanelProperties {
  animationClass?: string
  isDaySelected: (day: IsoDateString) => boolean
  onAnimationEnd: (event: AnimationEvent<HTMLElement>) => void
  onSelectDay: (day: IsoDateString) => void
  week: IsoDateString[]
}

const CurrentWeekPanel = ({
  animationClass,
  isDaySelected,
  onAnimationEnd,
  onSelectDay,
  week,
}: CurrentWeekPanelProperties) => {
  const dayReferences = useRef<(HTMLElement | null)[]>([])

  return (
    <div className={cn(panelClasses, animationClass)} onAnimationEnd={onAnimationEnd}>
      <div className={dayGridClasses}>
        {week.map((day, index) => (
          <div
            className={cn(
              'relative',
              isDaySelected(day) ? 'text-neutral-content' : 'text-base-content',
            )}
            key={day}
            ref={(element) => {
              dayReferences.current[index] = element
            }}>
            <CalendarDay
              date={day}
              isSelected={isDaySelected(day)}
              onClick={() => onSelectDay(day)}
            />
          </div>
        ))}
      </div>
      <SlidingIndicator
        itemRefs={dayReferences}
        radiusOn="bottom"
        selectedIndex={week.findIndex((day) => isDaySelected(day))}
      />
    </div>
  )
}

/** The week that moves out. It is a copy for the animation only, so it takes no input. */
const OutgoingWeekPanel = ({ slide }: { slide: WeekSlide }) => (
  <div aria-hidden className={cn(panelClasses, slide.animationClass)} inert>
    <div className={dayGridClasses}>
      {slide.from.map((day) => (
        <div className="text-base-content relative" key={day}>
          <CalendarDay date={day} onClick={() => {}} />
        </div>
      ))}
    </div>
  </div>
)

function ButtonLeft(properties: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button shape="square" size="sm" variant="ghost" {...properties}>
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}

// ─── Arrow buttons ──────────────────────────────────────────────────────────

function ButtonRight(properties: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button shape="square" size="sm" variant="ghost" {...properties}>
      <ChevronRight className="h-5 w-5" />
    </Button>
  )
}
