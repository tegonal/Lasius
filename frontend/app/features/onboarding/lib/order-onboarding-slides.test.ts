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

import { describe, expect, it } from 'vitest'

import { orderOnboardingSlides } from '~/features/onboarding/lib/order-onboarding-slides'

const slide = (id: string, order: number, isCompleted = false) => ({
  completed: isCompleted,
  id,
  order,
})

const ids = (slides: { id: string }[]) => slides.map((s) => s.id)

describe('orderOnboardingSlides', () => {
  it('puts the fixed slides first in their own order', () => {
    const result = orderOnboardingSlides([
      slide('booking', 4),
      slide('privateOrganisation', 0.5),
      slide('checklist', 0),
      slide('navigation', -0.5),
      slide('overview', -1),
    ])
    expect(ids(result)).toEqual([
      'overview',
      'navigation',
      'checklist',
      'privateOrganisation',
      'booking',
    ])
  })

  it('puts incomplete slides before complete slides, each by order', () => {
    const result = orderOnboardingSlides([
      slide('organisation', 1, true),
      slide('projects', 2),
      slide('workingHours', 3, true),
      slide('booking', 4),
    ])
    expect(ids(result)).toEqual(['projects', 'booking', 'organisation', 'workingHours'])
  })

  it('keeps a fixed slide first even when it is complete', () => {
    const result = orderOnboardingSlides([slide('projects', 2), slide('overview', -1, true)])
    expect(ids(result)).toEqual(['overview', 'projects'])
  })

  it('does not change the input array', () => {
    const input = [slide('projects', 2), slide('overview', -1)]
    orderOnboardingSlides(input)
    expect(ids(input)).toEqual(['projects', 'overview'])
  })
})
