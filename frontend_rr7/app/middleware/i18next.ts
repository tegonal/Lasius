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

import { createI18nextMiddleware } from 'remix-i18next/middleware'

import { i18nConfig } from '~/i18n-config.ts'
import { localeCookie } from '~/lib/cookies/i18next-cookie.server'

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      cookie: localeCookie,
      fallbackLanguage: i18nConfig.fallbackLng,
      supportedLanguages: i18nConfig.supportedLngs,
    },
    i18next: {
      defaultNS: i18nConfig.defaultNS,
      fallbackNS: i18nConfig.fallbackNS,
      ns: i18nConfig.ns,
      resources: i18nConfig.resources,
      returnEmptyString: i18nConfig.returnEmptyString,
    },
  })
