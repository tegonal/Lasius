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

import { getArrowVisibilityClasses } from './segmented-input-classes'

describe('getArrowVisibilityClasses', () => {
  it('shows the arrows and the label', () => {
    expect(getArrowVisibilityClasses(true)).toEqual({
      downButton: 'opacity-60 hover:opacity-100',
      downContainer: '',
      label: 'opacity-100',
      up: 'opacity-60 hover:opacity-100',
    })
  })

  it('hides the arrows and blocks their pointer events', () => {
    expect(getArrowVisibilityClasses(false)).toEqual({
      downButton: 'opacity-0',
      downContainer: 'pointer-events-none',
      label: 'opacity-0',
      up: 'pointer-events-none opacity-0',
    })
  })
})
