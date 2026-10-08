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

const FALLBACK_LOCALE = 'en'

type FetchFunction = (url: string) => Promise<Pick<Response, 'json' | 'ok'>>

/**
 * Loads the compiled MDX of a help file in the locale of the user. A missing locale falls back to
 * English. Throws when neither locale has the file.
 */
export const fetchHelpCode = async (
  fetchFunction: FetchFunction,
  locale: string,
  helpFileName: string,
): Promise<{ code: string; isFallbackLanguage: boolean }> => {
  const response = await fetchFunction(`/api/help/${locale}/${helpFileName}`)
  if (response.ok) {
    return { code: ((await response.json()) as { code: string }).code, isFallbackLanguage: false }
  }
  if (locale === FALLBACK_LOCALE) {
    throw new Error('Help file not found')
  }
  const fallback = await fetchFunction(`/api/help/${FALLBACK_LOCALE}/${helpFileName}`)
  if (!fallback.ok) {
    throw new Error('Help file not found')
  }
  return { code: ((await fallback.json()) as { code: string }).code, isFallbackLanguage: true }
}

/** Which parts of the help drawer show while the content loads, fails or is ready. */
export const getHelpView = ({
  error,
  hasContent,
  isFallbackLanguage,
  loading,
}: {
  error: boolean
  hasContent: boolean
  isFallbackLanguage: boolean
  loading: boolean
}) => ({
  showContent: hasContent && !loading && !error,
  showError: error && !loading,
  showFallbackNotice: isFallbackLanguage && !loading && !error,
  showSpinner: loading,
})
