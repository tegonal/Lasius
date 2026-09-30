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

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { DEFAULT_LOCALE, type Locale } from '~/i18n-config'
import { logger } from '~/lib/logger'

import { type TermsOfService } from './types'

/** docs/TOS.md tells operators to mount the files at /app/public/termsofservice in the image. */
const TERMS_DIRECTORY = join(process.cwd(), 'public', 'termsofservice')

interface LoadTermsOfServiceOptions {
  acceptedVersion?: null | string
  directory?: string
  locale: Locale
  version?: string
}

/**
 * The terms of service that the user must still accept, or null. The operator enables them with
 * LASIUS_TERMSOFSERVICE_VERSION, and a new version asks every user again.
 */
export async function loadTermsOfService({
  acceptedVersion,
  directory = TERMS_DIRECTORY,
  locale,
  version = process.env.LASIUS_TERMSOFSERVICE_VERSION,
}: LoadTermsOfServiceOptions): Promise<null | TermsOfService> {
  if (!version || acceptedVersion === version) return null

  const html = await readTermsFile(directory, locale)
  if (html !== null || locale === DEFAULT_LOCALE) {
    return { html, isFallback: false, version }
  }

  const fallbackHtml = await readTermsFile(directory, DEFAULT_LOCALE)
  return { html: fallbackHtml, isFallback: fallbackHtml !== null, version }
}

async function readTermsFile(directory: string, locale: Locale): Promise<null | string> {
  try {
    return await readFile(join(directory, `${locale}.html`), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn('Failed to read the terms of service file', { error, locale })
    }
    return null
  }
}
