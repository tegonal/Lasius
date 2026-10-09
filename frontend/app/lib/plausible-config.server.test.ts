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

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPlausibleConfig } from './plausible-config.server'

describe('getPlausibleConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the config when both variables have a value', () => {
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_HOST', 'https://plausible.example')
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN', 'time.example')

    expect(getPlausibleConfig()).toEqual({
      domain: 'time.example',
      host: 'https://plausible.example',
    })
  })

  it.each([
    ['the host', 'LASIUS_TELEMETRY_PLAUSIBLE_HOST'],
    ['the source domain', 'LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN'],
  ])('returns undefined without %s', (_case, name) => {
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_HOST', 'https://plausible.example')
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN', 'time.example')
    vi.stubEnv(name, '')

    expect(getPlausibleConfig()).toBeUndefined()
  })
})
