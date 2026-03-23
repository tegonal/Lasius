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

import { data } from 'react-router'
import { z } from 'zod'

import { i18nConfig } from '~/i18n-config'
import { logger } from '~/lib/logger'

import { type Route } from './+types/api.locales.$lang.$ns'

const resources = i18nConfig.resources
type Language = keyof typeof resources

const languageSchema = z.enum(
  i18nConfig.supportedLngs as [Language, ...Language[]],
)

export async function loader({ params }: Route.LoaderArgs) {
  const lng = languageSchema.safeParse(params.lang)

  if (lng.error) {
    logger.error('Invalid language', lng.error)
    return data({ error: lng.error }, { status: 400 })
  }

  const language = lng.data
  const namespaces = resources[language]

  const namespace = params.ns
  if (!namespace || !(namespace in namespaces)) {
    logger.error(`Invalid namespace: ${namespace}`)
    return data({ error: `Invalid namespace: ${namespace}` }, { status: 400 })
  }

  const namespaceData = namespaces[namespace as keyof typeof namespaces]

  const headers = new Headers()

  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
    )
  }

  return data(namespaceData, { headers })
}
