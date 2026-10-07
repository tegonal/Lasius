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

import { compile } from '@mdx-js/mdx'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RouterContextProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '~/lib/logger'

import { loader } from './api.help.$locale.$slug'

vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
vi.mock('@mdx-js/mdx', () => ({ compile: vi.fn() }))
vi.mock('~/lib/logger', () => ({ logger: { error: vi.fn() } }))

async function load(locale: string, slug: string) {
  const request = new Request('http://localhost/api/help/x/y')
  return loader({
    context: new RouterContextProvider(),
    params: { locale, slug },
    pattern: '/api/help/:locale/:slug',
    request,
    url: new URL(request.url),
  })
}

const helpPath = (locale: string, slug: string) =>
  join(process.cwd(), 'public', 'help', locale, `${slug}.mdx`)

describe('api.help loader', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('# Help')
    vi.mocked(compile).mockResolvedValue(
      Object.assign(Object.create(null) as object, { toString: () => 'compiled-code' }) as Awaited<
        ReturnType<typeof compile>
      >,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('strips path traversal characters from the locale and the slug', async () => {
    await load('../En', '../../etc/passwd')

    expect(existsSync).toHaveBeenCalledWith(helpPath('n', 'etcpasswd'))
  })

  it('answers 404 when the help file does not exist', async () => {
    vi.mocked(existsSync).mockReturnValue(false)

    const result = await load('en', 'missing')

    expect(result.init?.status).toBe(404)
    expect(readFileSync).not.toHaveBeenCalled()
  })

  it('returns the compiled code with a cache header', async () => {
    const result = await load('en', 'user-home')

    expect(readFileSync).toHaveBeenCalledWith(helpPath('en', 'user-home'), 'utf8')
    expect(result.data).toEqual({ code: 'compiled-code' })
    expect(new Headers(result.init?.headers).get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate',
    )
  })

  it('answers 500 and logs the error when the compile fails', async () => {
    const error = new Error('bad mdx')
    vi.mocked(compile).mockRejectedValue(error)

    const result = await load('en', 'user-home')

    expect(result.init?.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith('Failed to compile help file en/user-home', error)
  })
})
