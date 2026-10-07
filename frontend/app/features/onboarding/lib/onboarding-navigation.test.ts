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

import {
  initialOnboardingNavState,
  onboardingNavReducer,
  type OnboardingNavState,
} from '~/features/onboarding/lib/onboarding-navigation'

const at = (currentSlide: number, returnToChecklistIndex: null | number = null) =>
  ({ currentSlide, direction: 'forward', returnToChecklistIndex }) satisfies OnboardingNavState

describe('initialOnboardingNavState', () => {
  it('starts at the first slide, or at the checklist once it was reached', () => {
    expect(initialOnboardingNavState(false).currentSlide).toBe(0)
    expect(initialOnboardingNavState(true).currentSlide).toBe(2)
  })
})

describe('onboardingNavReducer', () => {
  it('next moves forward and clears the checklist return', () => {
    expect(onboardingNavReducer(at(4, 2), { slideCount: 8, type: 'next' })).toEqual({
      currentSlide: 5,
      direction: 'forward',
      returnToChecklistIndex: null,
    })
  })

  it('next on the last slide keeps the state', () => {
    const state = at(7)
    expect(onboardingNavReducer(state, { slideCount: 8, type: 'next' })).toBe(state)
  })

  it('previous moves back one slide', () => {
    expect(onboardingNavReducer(at(3), { type: 'previous' })).toEqual({
      currentSlide: 2,
      direction: 'backward',
      returnToChecklistIndex: null,
    })
  })

  it('previous on the first slide keeps the state', () => {
    const state = at(0)
    expect(onboardingNavReducer(state, { type: 'previous' })).toBe(state)
  })

  it('previous after a checklist jump returns to the checklist', () => {
    expect(onboardingNavReducer(at(5, 2), { type: 'previous' })).toEqual({
      currentSlide: 2,
      direction: 'backward',
      returnToChecklistIndex: null,
    })
  })

  it('a checklist jump remembers the checklist and sets the direction', () => {
    expect(onboardingNavReducer(at(2), { index: 5, type: 'gotoFromChecklist' })).toEqual({
      currentSlide: 5,
      direction: 'forward',
      returnToChecklistIndex: 2,
    })
    expect(onboardingNavReducer(at(2), { index: 1, type: 'gotoFromChecklist' }).direction).toBe(
      'backward',
    )
  })

  it('a checklist jump to an unknown or the current slide keeps the state', () => {
    const state = at(2)
    expect(onboardingNavReducer(state, { index: -1, type: 'gotoFromChecklist' })).toBe(state)
    expect(onboardingNavReducer(state, { index: 2, type: 'gotoFromChecklist' })).toBe(state)
  })

  it('a dot jump keeps a pending checklist return', () => {
    expect(onboardingNavReducer(at(5, 2), { index: 1, type: 'goto' })).toEqual({
      currentSlide: 1,
      direction: 'backward',
      returnToChecklistIndex: 2,
    })
  })
})
