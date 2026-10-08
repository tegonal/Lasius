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

import { describe, expect, it, vi } from 'vitest'

import { fetchHelpCode, getHelpView } from './help-content'

const respond = (files: Record<string, string>) =>
  vi.fn(async (url: string) => ({
    json: async () => ({ code: files[url] }),
    ok: Object.hasOwn(files, url),
  }))

describe('fetchHelpCode', () => {
  it('loads the file in the locale of the user', async () => {
    const fetchFunction = respond({ '/api/help/de/home.mdx': 'de-code' })
    await expect(fetchHelpCode(fetchFunction, 'de', 'home.mdx')).resolves.toEqual({
      code: 'de-code',
      isFallbackLanguage: false,
    })
    expect(fetchFunction).toHaveBeenCalledTimes(1)
  })

  it('falls back to English for a missing locale', async () => {
    const fetchFunction = respond({ '/api/help/en/home.mdx': 'en-code' })
    await expect(fetchHelpCode(fetchFunction, 'de', 'home.mdx')).resolves.toEqual({
      code: 'en-code',
      isFallbackLanguage: true,
    })
  })

  it('throws when no locale has the file', async () => {
    await expect(fetchHelpCode(respond({}), 'de', 'home.mdx')).rejects.toThrow(
      'Help file not found',
    )
    const english = respond({})
    await expect(fetchHelpCode(english, 'en', 'home.mdx')).rejects.toThrow('Help file not found')
    expect(english).toHaveBeenCalledTimes(1)
  })
})

describe('getHelpView', () => {
  const state = { error: false, hasContent: false, isFallbackLanguage: false, loading: false }

  it('shows only the spinner while it loads', () => {
    expect(getHelpView({ ...state, error: true, hasContent: true, loading: true })).toEqual({
      showContent: false,
      showError: false,
      showFallbackNotice: false,
      showSpinner: true,
    })
  })

  it('shows only the error after a failure', () => {
    expect(getHelpView({ ...state, error: true, isFallbackLanguage: true })).toEqual({
      showContent: false,
      showError: true,
      showFallbackNotice: false,
      showSpinner: false,
    })
  })

  it('shows the content, and the notice for an English fallback', () => {
    expect(getHelpView({ ...state, hasContent: true, isFallbackLanguage: true })).toEqual({
      showContent: true,
      showError: false,
      showFallbackNotice: true,
      showSpinner: false,
    })
  })
})
