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

export type OnboardingNavAction =
  | { index: number; type: 'goto' }
  | { index: number; type: 'gotoFromChecklist' }
  | { slideCount: number; type: 'next' }
  | { type: 'previous' }

export type OnboardingNavState = {
  currentSlide: number
  direction: 'backward' | 'forward'
  /** The checklist index to return to after a jump from the checklist, else null. */
  returnToChecklistIndex: null | number
}

const CHECKLIST_SLIDE_INDEX = 2

export const initialOnboardingNavState = (isChecklistReached: boolean): OnboardingNavState => ({
  currentSlide: isChecklistReached ? CHECKLIST_SLIDE_INDEX : 0,
  direction: 'forward',
  returnToChecklistIndex: null,
})

const directionTo = (from: number, to: number) => (to > from ? 'forward' : 'backward')

const previous = (state: OnboardingNavState): OnboardingNavState => {
  if (state.returnToChecklistIndex !== null) {
    return {
      currentSlide: state.returnToChecklistIndex,
      direction: 'backward',
      returnToChecklistIndex: null,
    }
  }
  if (state.currentSlide === 0) return state
  return { ...state, currentSlide: state.currentSlide - 1, direction: 'backward' }
}

/** Slide navigation of the tutorial. An action without an effect returns the same state object. */
export const onboardingNavReducer = (
  state: OnboardingNavState,
  action: OnboardingNavAction,
): OnboardingNavState => {
  switch (action.type) {
    case 'goto': {
      return {
        ...state,
        currentSlide: action.index,
        direction: directionTo(state.currentSlide, action.index),
      }
    }
    case 'gotoFromChecklist': {
      if (action.index === -1 || action.index === state.currentSlide) return state
      return {
        currentSlide: action.index,
        direction: directionTo(state.currentSlide, action.index),
        returnToChecklistIndex: state.currentSlide,
      }
    }
    case 'next': {
      if (state.currentSlide >= action.slideCount - 1) return state
      return {
        currentSlide: state.currentSlide + 1,
        direction: 'forward',
        returnToChecklistIndex: null,
      }
    }
    case 'previous': {
      return previous(state)
    }
  }
}
