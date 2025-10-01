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

import { t } from 'i18next'
import { getRequestHeaders } from 'lib/api/hooks/useTokensWithAxiosRequests'
import { logout } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { logger } from 'lib/logger'
import { NextApiRequest, NextApiResponse } from 'next'
import NextAuth, { NextAuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { OAuthConfig } from 'next-auth/providers'
import GitHub from 'next-auth/providers/github'
import GitLab from 'next-auth/providers/gitlab'
import Keyclaok from 'next-auth/providers/keycloak'
import {
  AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
  AUTH_PROVIDER_INTERNAL_LASIUS,
} from 'projectConfig/constants'

const gitlabUrl = process.env.GITLAB_OAUTH_URL || 'https://gitlab.com'
const githubUrl = 'https://api.github.com/'

const REFRESH_TOKEN_PROGRESS: Map<string, Promise<JWT>> = new Map()
interface CacheItem {
  token: JWT
  expiry: number
}
const REFRESH_TOKEN_CACHE: Map<string, CacheItem> = new Map()
const REFRESH_TOKEN_CACHE_LIFESPAN_MS = 30000

const internalProvider: OAuthConfig<any> = {
  id: AUTH_PROVIDER_INTERNAL_LASIUS,
  // wrap into `t` to ensure we have a translation to it
  name:
    t('auth.providers.internalLasius', { defaultValue: 'Internal Lasius Sign-in' }) ||
    'Internal Lasius Sign-in',
  version: '2.0',
  type: 'oauth',
  // redirect to local login page
  authorization: {
    url: process.env.NEXTAUTH_URL + '/internal_oauth/login',
    params: {
      scope: 'profile openid email',
    },
  },
  token:
    (process.env.LASIUS_API_URL_INTERNAL || process.env.LASIUS_API_URL) + '/oauth2/access_token',
  userinfo: (process.env.LASIUS_API_URL_INTERNAL || process.env.LASIUS_API_URL) + '/oauth2/profile',
  clientId: process.env.LASIUS_OAUTH_CLIENT_ID,
  clientSecret: process.env.LASIUS_OAUTH_CLIENT_SECRET,
  checks: ['pkce', 'state'],
  idToken: false,
  profile: async (profile: any) => {
    return {
      id: profile.id.toString(),
      name: profile.firstName + ' ' + profile.lastName,
      email: profile.email,
    }
  },
}

async function requestRefreshToken(refresh_token: string, provider?: string): Promise<any> {
  switch (provider) {
    case 'gitlab':
      return await fetch(gitlabUrl + '/oauth/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.GITLAB_OAUTH_CLIENT_ID || '',
          client_secret: process.env.GITLAB_OAUTH_CLIENT_SECRET || '',
        }),
      })
    case 'github':
      return await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
          client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
        }),
      })
    case AUTH_PROVIDER_CUSTOMER_KEYCLOAK:
      return await fetch(process.env.KEYCLOAK_OAUTH_URL + '/protocol/openid-connect/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.KEYCLOAK_OAUTH_CLIENT_ID || '',
          client_secret: process.env.KEYCLOAK_OAUTH_CLIENT_SECRET || '',
        }),
      })
    default:
      return await fetch(process.env.NEXTAUTH_URL + '/backend/oauth2/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.LASIUS_OAUTH_CLIENT_ID || '',
          client_secret: process.env.LASIUS_OAUTH_CLIENT_SECRET || '',
        }),
      })
  }
}

async function fetchRefreshAccessToken(refresh_token: string, token: JWT): Promise<JWT> {
  try {
    const response = await requestRefreshToken(refresh_token, token.provider)

    const tokensOrError = await response.json()

    if (!response.ok) {
      throw tokensOrError
    }

    if (process.env.LASIUS_DEBUG) {
      logger.info(
        '[NextAuth][refreshAccessToken][RenewedToken] refresh_token=%s, access_token=%s',
        tokensOrError?.refresh_token,
        tokensOrError?.access_token,
      )
    }

    const newTokens = tokensOrError as {
      access_token: string
      expires_in: number
      refresh_token?: string
    }
    const newTokenResult = {
      ...token,
      access_token: newTokens.access_token,
      expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
      // Some providers only issue refresh tokens once, so preserve if we did not get a new one
      refresh_token: newTokens.refresh_token ?? token.refresh_token,
    }

    REFRESH_TOKEN_CACHE.set(refresh_token, {
      token: newTokenResult,
      expiry: Date.now() + REFRESH_TOKEN_CACHE_LIFESPAN_MS,
    })

    return newTokenResult
  } catch (error) {
    if (process.env.LASIUS_DEBUG) {
      logger.warn('[NextAuth][RefreshAccessTokenError]', error)
    }

    token.error = 'RefreshAccessTokenError'
    return token
  }
}

/**
 * Takes a token, and returns a new token with updated
 * `access_token` and `expires_at`. If an error occurs,
 * returns the old token and an error property
 */
function refreshAccessToken(token: JWT): undefined | Promise<JWT> {
  if (!token?.refresh_token) {
    return undefined
  }

  // Check if refresh is already in progress and return the same promise
  const inProgressRefresh = REFRESH_TOKEN_PROGRESS.get(token.refresh_token)
  if (inProgressRefresh) {
    if (process.env.LASIUS_DEBUG) {
      logger.debug(
        '[NextAuth][refreshAccessToken][WaitingForRefresh] refresh_token=%s',
        token.refresh_token,
      )
    }
    return inProgressRefresh
  }

  const cachedResult = REFRESH_TOKEN_CACHE.get(token.refresh_token)
  const now = Date.now()
  if (cachedResult) {
    if (process.env.LASIUS_DEBUG) {
      logger.debug(
        '[NextAuth][refreshAccessToken][CachedRefresh] refresh_token=%s, access_token=%s, time_remaining=%s',
        token.refresh_token,
        cachedResult.token,
        now - cachedResult.expiry,
      )
    }
    if (cachedResult.expiry < now) {
      if (process.env.LASIUS_DEBUG) {
        logger.debug(
          '[NextAuth][refreshAccessToken][RemoveExpiredRefreshToken] refresh_token=%s, time_remaining=%s',
          token.refresh_token,
          now - cachedResult.expiry,
        )
      }
      REFRESH_TOKEN_CACHE.delete(token.refresh_token)
    }
    return Promise.resolve(cachedResult.token)
  }

  // clean refresh token cache
  const expiredCachedRefreshTokens = Array.from(REFRESH_TOKEN_CACHE.entries())
    .filter(([_, item]) => item.expiry < now)
    .map(([key, _]) => key)
  if (process.env.LASIUS_DEBUG) {
    logger.debug(
      '[NextAuth][CleanCachedRefreshTokens] number_of_expired_tokens=%s',
      expiredCachedRefreshTokens.length,
    )
  }
  expiredCachedRefreshTokens.forEach((token) => REFRESH_TOKEN_CACHE.delete(token))

  if (process.env.LASIUS_DEBUG) {
    logger.debug('[NextAuth][refreshAccessToken] refresh_token=%s', token?.refresh_token)
  }

  // Create and store the refresh promise
  const refreshPromise = fetchRefreshAccessToken(token.refresh_token, token)
  REFRESH_TOKEN_PROGRESS.set(token.refresh_token, refreshPromise)

  // Clean up the promise after completion (success or failure)
  refreshPromise.finally(() => {
    if (token.refresh_token) {
      REFRESH_TOKEN_PROGRESS.delete(token.refresh_token)
    }
  })

  return refreshPromise
}
const providers: OAuthConfig<any>[] = []
if (process.env.LASIUS_OAUTH_CLIENT_ID && process.env.LASIUS_OAUTH_CLIENT_SECRET) {
  providers.push(internalProvider)
}
if (
  process.env.KEYCLOAK_OAUTH_CLIENT_ID &&
  process.env.KEYCLOAK_OAUTH_CLIENT_SECRET &&
  process.env.KEYCLOAK_OAUTH_URL
) {
  providers.push(
    Keyclaok({
      id: AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
      name: process.env.KEYCLOAK_OAUTH_PROVIDER_NAME || 'Keycloak',
      clientId: process.env.KEYCLOAK_OAUTH_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_OAUTH_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_OAUTH_URL,
    }),
  )
}
if (process.env.GITLAB_OAUTH_CLIENT_ID && process.env.GITLAB_OAUTH_CLIENT_SECRET) {
  providers.push(
    GitLab({
      clientId: process.env.GITLAB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITLAB_OAUTH_CLIENT_SECRET,
      wellKnown: gitlabUrl + '/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid email' } },
      profile(profile) {
        return {
          id: (profile.id || profile.sub).toString(),
          name: profile.name ?? profile.username,
          email: profile.email,
          image: profile.avatar_url,
          access_token_issuer: gitlabUrl,
        }
      },
    }),
  )
}
if (process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      authorization: {
        url: 'https://github.com/login/oauth/authorize',
        params: { scope: 'user:email' },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          access_token_issuer: githubUrl,
        }
      },
    }),
  )
}

export const nextAuthOptions: (locale?: string) => NextAuthOptions = (locale) => {
  return {
    debug: process.env.LASIUS_DEBUG === 'true',
    providers: providers,
    session: {
      strategy: 'jwt',
    },
    jwt: {
      secret: process.env.NEXTAUTH_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: `/login?${locale ? 'locale=' + locale : ''}`,
      signOut: `/`,
    },
    callbacks: {
      async session({ session, token, user }) {
        if (token) {
          session.user = token?.user
          session.access_token = token.access_token
          session.access_token_issuer = token.access_token_issuer
          session.error = token?.error
          session.provider = token.provider
          session.expires_at = token.expires_at
        }
        session.user = session.user || user
        if (process.env.LASIUS_DEBUG) {
          logger.debug('[NextAuth][Session]', session)
        }

        return session
      },
      async jwt({ token, account, user, profile, trigger }) {
        if (process.env.LASIUS_DEBUG) {
          logger.debug(
            '[NextAuth][JWT] refresh_token=%s, token_expires_at=%s, trigger=%s',
            token.refresh_token,
            token.expires_at,
            trigger,
          )
        }
        // Initial sign in
        if (account) {
          // First-time login, save the `access_token`, its expiry and the `refresh_token`
          return {
            ...token,
            access_token: account.access_token,
            access_token_issuer: user?.access_token_issuer,
            expires_at: account.expires_at,
            refresh_token: account.refresh_token,
            user: user || {
              ...profile,
              access_token: account.access_token,
            },
            provider: account.provider,
          }
        } else if (!token.expires_at || Date.now() < token.expires_at * 1000) {
          // Subsequent logins, but the `access_token` is still valid
          return token
        } else {
          // Subsequent logins, but the `access_token` has expired, try to refresh it
          if (!token.refresh_token) throw new TypeError('Missing refresh_token')
          if (token.error === 'RefreshAccessTokenError') {
            if (process.env.LASIUS_DEBUG) {
              logger.info('Token refresh already failed, not trying again.')
            }
            return token
          }

          // Access token has expired, try to update it
          const refreshTokenResult = refreshAccessToken(token)
          if (refreshTokenResult === undefined) {
            // This can happen if there's no refresh_token
            throw new Error('Refresh expired token failed - no refresh token available')
          }
          return await refreshTokenResult
        }
      },
    },
    events: {
      async signOut({ token }: { token: JWT }) {
        if (process.env.LASIUS_DEBUG) {
          logger.info('[nextauth][events][signOut]', token.provider)
        }
        // auto logout from keycloak instance
        if (token.provider === AUTH_PROVIDER_CUSTOMER_KEYCLOAK) {
          if (process.env.LASIUS_DEBUG) {
            logger.info(
              'auto-logout from keycloak at',
              process.env.KEYCLOAK_OAUTH_URL + '/protocol/openid-connect/logout',
            )
          }

          await fetch(process.env.KEYCLOAK_OAUTH_URL + '/protocol/openid-connect/logout', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + token.access_token,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_OAUTH_CLIENT_ID || '',
              client_secret: process.env.KEYCLOAK_OAUTH_CLIENT_SECRET || '',
              refresh_token: token.refresh_token || '',
            }),
          })
        }
        // or internal lasius provider
        else if (token.provider === AUTH_PROVIDER_INTERNAL_LASIUS) {
          await logout(getRequestHeaders(token.access_token, token.access_token_issuer))
        }
      },
      async signIn() {
        if (process.env.LASIUS_DEBUG) {
          logger.info('[nextauth][events][signIn]')
        }
      },
    },
  }
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  const locale = req.query.locale?.toString()
  return NextAuth(req, res, nextAuthOptions(locale))
}
