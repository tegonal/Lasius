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

import { validateInputChar } from './input-validation'

const datePattern = /[\d.]/
const timePattern = /[\d:]/

describe('validateInputChar', () => {
  describe('digits (0-9)', () => {
    it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
      'allows digit "%s" for date pattern',
      (digit) => {
        expect(validateInputChar(digit, datePattern)).toBe(true)
      },
    )

    it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
      'allows digit "%s" for time pattern',
      (digit) => {
        expect(validateInputChar(digit, timePattern)).toBe(true)
      },
    )
  })

  describe('pattern-specific characters', () => {
    it('allows "." for date pattern', () => {
      expect(validateInputChar('.', datePattern)).toBe(true)
    })

    it('allows ":" for time pattern', () => {
      expect(validateInputChar(':', timePattern)).toBe(true)
    })

    it('rejects "." for time pattern', () => {
      expect(validateInputChar('.', timePattern)).toBe(false)
    })

    it('rejects ":" for date pattern', () => {
      expect(validateInputChar(':', datePattern)).toBe(false)
    })
  })

  describe('rejected characters', () => {
    it.each(['a', 'b', 'z', 'A', 'Z'])(
      'rejects letter "%s" for date pattern',
      (letter) => {
        expect(validateInputChar(letter, datePattern)).toBe(false)
      },
    )

    it.each(['a', 'b', 'z', 'A', 'Z'])(
      'rejects letter "%s" for time pattern',
      (letter) => {
        expect(validateInputChar(letter, timePattern)).toBe(false)
      },
    )

    it.each(['@', '#', '$', '%', '!', '&'])(
      'rejects special character "%s" for date pattern',
      (char) => {
        expect(validateInputChar(char, datePattern)).toBe(false)
      },
    )

    it.each(['@', '#', '$', '%', '!', '&'])(
      'rejects special character "%s" for time pattern',
      (char) => {
        expect(validateInputChar(char, timePattern)).toBe(false)
      },
    )
  })

  describe('multi-character keys (special keys)', () => {
    it.each([
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ])('allows special key "%s" regardless of pattern', (key) => {
      expect(validateInputChar(key, datePattern)).toBe(true)
      expect(validateInputChar(key, timePattern)).toBe(true)
    })

    it('allows other multi-character keys like "Shift"', () => {
      expect(validateInputChar('Shift', datePattern)).toBe(true)
      expect(validateInputChar('Control', timePattern)).toBe(true)
    })
  })

  describe('empty string key', () => {
    it('returns true for empty string', () => {
      expect(validateInputChar('', datePattern)).toBe(true)
      expect(validateInputChar('', timePattern)).toBe(true)
    })
  })
})
