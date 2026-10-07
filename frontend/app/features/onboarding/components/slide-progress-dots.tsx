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

import { CheckCircle2, Circle } from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

type DotState = 'active' | 'completed' | 'idle'

const DOT_CLASS: Record<DotState, string> = {
  active: 'text-primary',
  completed: 'text-success',
  idle: 'text-base-content/30',
}

const getDotState = (slide: { completed: boolean; id: string }, isActive: boolean): DotState => {
  if (slide.completed && slide.id !== 'checklist') return 'completed'
  return isActive ? 'active' : 'idle'
}

interface SlideProgressDotsProperties {
  currentSlide: number
  onSelect: (index: number) => void
  slides: { completed: boolean; id: string }[]
}

export const SlideProgressDots = ({
  currentSlide,
  onSelect,
  slides,
}: SlideProgressDotsProperties) => (
  <div className="mb-6 flex items-center justify-center gap-2">
    {slides.map((slide, index) => {
      const state = getDotState(slide, index === currentSlide)
      return (
        <button
          aria-label={`Go to slide ${index + 1}`}
          className="cursor-pointer transition-opacity hover:opacity-80"
          data-testid={`onboarding-dot-${slide.id}`}
          key={slide.id}
          onClick={() => onSelect(index)}
          type="button">
          <LucideIcon
            className={DOT_CLASS[state]}
            icon={state === 'idle' ? Circle : CheckCircle2}
            size={12}
          />
        </button>
      )
    })}
  </div>
)
