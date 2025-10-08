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

import { getLocaleFromCookie } from 'lib/utils/auth/getLocaleFromCookie'
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import nextI18NextConfig from '../../../next-i18next.config'

/**
 * Helper for pages that don't require authentication (e.g., login pages)
 * Handles locale detection and translation loading
 */
export async function getServerSidePropsWithoutAuth(
  context: GetServerSidePropsContext,
  getPageProps?: (
    context: GetServerSidePropsContext,
    locale: string,
  ) => Promise<Record<string, any>>,
): Promise<GetServerSidePropsResult<any>> {
  const { query } = context

  // Get locale from cookie or query param
  const cookieLocale = getLocaleFromCookie(context)
  const locale = query.locale?.toString() || cookieLocale

  // Import getValidLocale dynamically to avoid circular dependencies
  const { getValidLocale } = await import('lib/config/locales')
  const validLocale = getValidLocale(locale)

  // Get additional page-specific props if provided
  const pageProps = getPageProps ? await getPageProps(context, validLocale) : {}

  return {
    props: {
      ...(await serverSideTranslations(validLocale, ['common'], nextI18NextConfig)),
      locale: validLocale,
      ...pageProps,
    },
  }
}
