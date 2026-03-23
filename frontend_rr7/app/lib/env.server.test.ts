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

import { getServerEnv, getServerEnvRequired } from './env.server'

describe('getServerEnvRequired', () => {
  it('returns the value when env var exists', () => {
    process.env.TEST_ENV_VAR = 'test-value'
    expect(getServerEnvRequired('TEST_ENV_VAR')).toBe('test-value')
    delete process.env.TEST_ENV_VAR
  })

  it('throws when env var is missing', () => {
    delete process.env.MISSING_VAR
    expect(() => getServerEnvRequired('MISSING_VAR')).toThrow(
      'Missing required env var: MISSING_VAR',
    )
  })

  it('throws when env var is empty string', () => {
    process.env.EMPTY_VAR = ''
    expect(() => getServerEnvRequired('EMPTY_VAR')).toThrow(
      'Missing required env var: EMPTY_VAR',
    )
    delete process.env.EMPTY_VAR
  })
})

describe('getServerEnv', () => {
  it('returns the value when env var exists', () => {
    process.env.TEST_ENV_VAR = 'test-value'
    expect(getServerEnv('TEST_ENV_VAR')).toBe('test-value')
    delete process.env.TEST_ENV_VAR
  })

  it('returns undefined when env var is missing and no default', () => {
    delete process.env.MISSING_VAR
    expect(getServerEnv('MISSING_VAR')).toBeUndefined()
  })

  it('returns default value when env var is missing', () => {
    delete process.env.MISSING_VAR
    expect(getServerEnv('MISSING_VAR', 'fallback')).toBe('fallback')
  })

  it('returns env var value over default when both exist', () => {
    process.env.TEST_ENV_VAR = 'real-value'
    expect(getServerEnv('TEST_ENV_VAR', 'fallback')).toBe('real-value')
    delete process.env.TEST_ENV_VAR
  })
})
