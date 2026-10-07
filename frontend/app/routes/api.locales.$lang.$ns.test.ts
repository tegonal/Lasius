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

import { RouterContextProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { resources } from '~/i18n-resources.server'

import { loader } from './api.locales.$lang.$ns'

async function load(lang: string, ns: string) {
  const request = new Request(`http://localhost/api/locales/${lang}/${ns}`)
  return loader({
    context: new RouterContextProvider(),
    params: { lang, ns },
    pattern: '/api/locales/:lang/:ns',
    request,
    url: new URL(request.url),
  })
}

describe('api.locales loader', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('answers 400 for an unknown language', async () => {
    const result = await load('xx', 'common')

    expect(result.init?.status).toBe(400)
  })

  it('answers 400 for an unknown namespace', async () => {
    const result = await load('de', 'nope')

    expect(result.init?.status).toBe(400)
    expect(result.data).toEqual({ error: 'Invalid namespace: nope' })
  })

  it.each(['__proto__', 'constructor', 'toString'])(
    'answers 400 for the inherited property %s',
    async (ns) => {
      const result = await load('de', ns)

      expect(result.init?.status).toBe(400)
    },
  )

  it('returns the namespace without a cache header outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    const result = await load('de', 'common')

    expect(result.data).toBe(resources.de.common)
    expect(result.init?.status).toBeUndefined()
    expect(new Headers(result.init?.headers).get('Cache-Control')).toBeNull()
  })

  it('sets a public cache header in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const result = await load('en', 'common')

    expect(result.data).toBe(resources.en.common)
    expect(new Headers(result.init?.headers).get('Cache-Control')).toContain('public, max-age=300')
  })
})
