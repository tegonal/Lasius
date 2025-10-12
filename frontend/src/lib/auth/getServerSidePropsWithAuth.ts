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

import { getRequestHeaders } from 'lib/api/hooks/useTokensWithAxiosRequests'
import { ModelsUser } from 'lib/api/lasius'
import { getGetUserProfileKey, getUserProfile } from 'lib/api/lasius/user/user'
import { logger } from 'lib/logger'
import { getLocaleFromCookie } from 'lib/utils/auth/getLocaleFromCookie'
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import nextI18NextConfig from '../../../next-i18next.config'

export interface AuthPageProps {
  session: Session | null
  profile: ModelsUser | null
  fallback: Record<string, any>
  locale: string
}

/**
 * Wrapper for getServerSideProps that handles authentication and profile fetching
 * This replaces the App.getInitialProps pattern with a more modern approach
 */
export async function getServerSidePropsWithAuth(
  context: GetServerSidePropsContext,
  // Optional callback for page-specific props
  getPageProps?: (
    context: GetServerSidePropsContext,
    authData: { session: Session | null; profile: ModelsUser | null },
  ) => Promise<Record<string, any>>,
  // Additional namespaces beyond 'common'
  namespaces: string[] = [],
): Promise<GetServerSidePropsResult<AuthPageProps & Record<string, any>>> {
  const { req, resolvedUrl } = context
  const locale = getLocaleFromCookie(context)

  // Get session
  const session = await getSession({ req })

  // Fetch user profile if authenticated
  let profile: ModelsUser | null = null
  if (session?.access_token) {
    try {
      profile = await getUserProfile(
        getRequestHeaders(session.access_token, session.access_token_issuer),
      )
    } catch (error) {
      // Redirect to login if profile fetch fails (except on login page)
      if (!resolvedUrl.includes('/login')) {
        logger.warn('[Auth][UserProfile][Failed]', error)
        return {
          redirect: {
            destination: '/login?error=fetchProfileFailed',
            permanent: false,
          },
        }
      }
    }
  }

  // Get page-specific props if provided
  const pageProps = getPageProps ? await getPageProps(context, { session, profile }) : {}

  // Get translations - always include 'common' plus any additional namespaces
  const allNamespaces = ['common', ...namespaces]
  const translations = await serverSideTranslations(locale, allNamespaces, nextI18NextConfig)

  return {
    props: {
      session,
      profile,
      fallback: {
        ...(profile && { [getGetUserProfileKey().toString()]: profile }),
      },
      locale,
      ...translations,
      ...pageProps,
    },
  }
}

/**
 * Helper for protected pages that require authentication
 */
export async function getServerSidePropsWithAuthRequired(
  context: GetServerSidePropsContext,
  getPageProps?: (
    context: GetServerSidePropsContext,
    authData: { session: Session; profile: ModelsUser },
  ) => Promise<Record<string, any>>,
  namespaces: string[] = [],
): Promise<GetServerSidePropsResult<AuthPageProps & Record<string, any>>> {
  const result = await getServerSidePropsWithAuth(
    context,
    async (ctx, authData) => {
      // Redirect if not authenticated
      if (!authData.session || !authData.profile) {
        return {} // Will be redirected below
      }
      // Safe to cast here since we checked above
      return getPageProps
        ? await getPageProps(ctx, authData as { session: Session; profile: ModelsUser })
        : {}
    },
    namespaces,
  )

  // Check if we need to redirect
  if ('props' in result) {
    const props = result.props as AuthPageProps & Record<string, any>
    if (!props.session || !props.profile) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }
  }

  return result
}
