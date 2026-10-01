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

import { COOKIE_MAX_AGE_1_YEAR } from '~/config/constants'

import { localeCookie } from './i18next-cookie.server'

describe('localeCookie', () => {
  it('keeps the language for one year, like the theme cookie', async () => {
    const serialized = await localeCookie.serialize('de')
    expect(serialized).toContain(`Max-Age=${COOKIE_MAX_AGE_1_YEAR}`)
  })

  it('round-trips the locale', async () => {
    const serialized = await localeCookie.serialize('fr')
    const cookieValue = serialized.split(';', 1)[0] ?? ''
    expect(await localeCookie.parse(cookieValue)).toBe('fr')
  })
})
