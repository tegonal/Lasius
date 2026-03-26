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

import i18next from 'i18next'
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector'
import Fetch from 'i18next-fetch-backend'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { HydratedRouter } from 'react-router/dom'
import { getInitialNamespaces } from 'remix-i18next/client'

import { i18nConfig } from '~/i18n-config.ts'
import { logger } from '~/lib/logger'

globalThis.addEventListener('error', (event) => {
  logger.error({ error: event.error, type: 'window-error' }, 'Uncaught error')
})

globalThis.addEventListener('unhandledrejection', (event) => {
  logger.error(
    { error: event.reason, type: 'unhandled-rejection' },
    'Unhandled rejection',
  )
})

async function main() {
  await i18next
    .use(initReactI18next)
    .use(Fetch)
    .use(I18nextBrowserLanguageDetector)
    .init({
      ...i18nConfig,
      backend: { loadPath: '/api/locales/{{lng}}/{{ns}}' },
      detection: { caches: [], order: ['htmlTag'] },
      ns: getInitialNamespaces(),
    })

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>,
    )
  })
}

main().catch((error) => {
  logger.error({ error, type: 'hydration' }, 'Hydration error')
})
