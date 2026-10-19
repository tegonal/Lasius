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

import { type AnimationEvent, useState } from 'react'

import { type IsoDateString } from '~/lib/utils/dates'

export interface WeekSlide {
  animationClass: string
  direction: 'next' | 'previous'
  from: IsoDateString[]
}

/** The slide from the shown week to the given week, or undefined when the first day did not change. */
export const getWeekSlide = (
  shownWeek: IsoDateString[],
  week: IsoDateString[],
): undefined | WeekSlide => {
  const [shownStart] = shownWeek
  const [start] = week
  if (!shownStart || !start || shownStart === start) return undefined
  const direction = start > shownStart ? 'next' : 'previous'
  return {
    animationClass:
      direction === 'next' ? 'animate-week-slide-next' : 'animate-week-slide-previous',
    direction,
    from: shownWeek,
  }
}

/** A change of the first day starts a slide. The arrows, the Today button and a URL change all do this. */
export const useWeekSlide = (week: IsoDateString[]) => {
  const [shownWeek, setShownWeek] = useState(week)
  const [slide, setSlide] = useState<WeekSlide>()

  if (shownWeek[0] !== week[0]) {
    setShownWeek(week)
    setSlide(getWeekSlide(shownWeek, week))
  }

  // Only the animation of the panel itself ends the slide, not an animation inside a day cell.
  const endSlide = (event: AnimationEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) setSlide(undefined)
  }

  return { endSlide, slide }
}
