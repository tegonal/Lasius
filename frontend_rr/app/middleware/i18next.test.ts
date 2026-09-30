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
import { describe, expect, it } from 'vitest'

import { i18nConfig } from '~/i18n-config'
import { i18nServerConfig } from '~/i18n-resources.server'

import { getInstance, getLocale, i18nextMiddleware } from './i18next'

type MiddlewareArguments = Parameters<typeof i18nextMiddleware>[0]

async function runMiddleware(url: string) {
  const context = new RouterContextProvider()
  const request = new Request(url)
  const middlewareArguments = { context, params: {}, request } as unknown as MiddlewareArguments
  await i18nextMiddleware(middlewareArguments, () => Promise.resolve(new Response()))
  return context
}

describe('i18nextMiddleware', () => {
  // The client instance spreads i18nConfig. A key missing here makes the server render differ.
  it('gives the request instance every option of the shared config', async () => {
    const { options } = getInstance(await runMiddleware('http://localhost/user/home?lng=de'))
    expect(options).toMatchObject({
      defaultNS: i18nConfig.defaultNS,
      fallbackLng: [i18nConfig.fallbackLng],
      returnEmptyString: i18nConfig.returnEmptyString,
      showSupportNotice: false,
      supportedLngs: expect.arrayContaining(i18nConfig.supportedLngs),
    })
  })

  // The 404 fallback in entry.server.tsx passes i18nServerConfig.fallbackLng as lng.
  it('leaves the shared server config unchanged', async () => {
    await runMiddleware('http://localhost/user/home')
    expect(i18nServerConfig.fallbackLng).toBe('en')
    expect(i18nServerConfig.supportedLngs).not.toContain('cimode')
  })

  it('detects the language of the request', async () => {
    expect(getLocale(await runMiddleware('http://localhost/user/home?lng=fr'))).toBe('fr')
  })
})
