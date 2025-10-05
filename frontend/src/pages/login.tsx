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

'use server'

import { SiGithub, SiGitlab, SiKeycloak } from '@icons-pack/react-simple-icons'
import { LoadingInfoPanel, LoginInfoPanel } from 'components/features/login/authInfoPanels'
import { AuthLayout } from 'components/features/login/authLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { LasiusIcon } from 'components/ui/icons/LasiusIcon'
import { Logo } from 'components/ui/icons/Logo'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { HelpButton } from 'components/ui/navigation/HelpButton'
import { getConfiguration } from 'lib/api/lasius/general/general'
import { getServerSidePropsWithoutAuth } from 'lib/auth/getServerSidePropsWithoutAuth'
import { logger } from 'lib/logger'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { formatISOLocale } from 'lib/utils/date/dates'
import { getValidRouteOrFallback } from 'lib/utils/routing/validateRoute'
import { AlertTriangle } from 'lucide-react'
import { GetServerSidePropsContext, NextPage } from 'next'
import { ClientSafeProvider, getCsrfToken, getProviders, signIn } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
  AUTH_PROVIDER_INTERNAL_LASIUS,
} from 'projectConfig/constants'
import { ROUTES } from 'projectConfig/routes'
import { useCallback, useEffect, useState } from 'react'
import { useCalendarActions } from 'stores/calendarStore'

type CustomizedClientSafeProvider = ClientSafeProvider & {
  custom_logo: string | null
}

const Login: NextPage<{
  csrfToken: string
  providers: CustomizedClientSafeProvider[]
  locale?: string
  defaultLocale?: string
}> = ({ csrfToken, providers, locale, defaultLocale }) => {
  const plausible = usePlausible<LasiusPlausibleEvents>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation('common')
  const router = useRouter()
  const { setSelectedDate } = useCalendarActions()
  const { invitation_id = null, email = null, error = null, callbackUrl = null } = router.query

  // Build dynamic translation key for error messages
  const getErrorMessage = (errorCode: string | string[] | null): string => {
    if (!errorCode) return ''
    const code = Array.isArray(errorCode) ? errorCode[0] : errorCode

    // Always use switch statement to ensure we're explicitly calling t() with the right key
    // This avoids issues with how i18next handles missing keys
    switch (code) {
      case 'OAuthCallback':
      case 'OAuthCallbackError':
        return t('auth.errors.oauthCallback', {
          defaultValue: 'Authentication failed. Please try again.',
        })
      case 'SessionRequired':
        return t('auth.errors.sessionRequired', {
          defaultValue: 'Please sign in to continue.',
        })
      case 'Callback':
        return t('auth.errors.callback', {
          defaultValue: 'Authentication callback failed. Please try again.',
        })
      case 'fetchProfileFailed':
        return t('auth.errors.fetchProfileFailed', {
          defaultValue: "Couldn't load user profile. Please try logging in again.",
        })
      default:
        return t('auth.errors.general', {
          defaultValue: 'Authentication error. Please try again.',
          error: code,
        })
    }
  }

  const signInToProvider = useCallback(
    async (provider: string) => {
      setIsSubmitting(true)

      // Validate the callback URL before passing to NextAuth
      let rawCallbackUrl = callbackUrl?.toString() || ROUTES.USER.INDEX
      if (callbackUrl) {
        rawCallbackUrl = getValidRouteOrFallback(callbackUrl.toString(), ROUTES.USER.INDEX)
        if (rawCallbackUrl !== callbackUrl.toString()) {
          logger.warn('[Login] Invalid callback URL from query, using fallback:', {
            original: callbackUrl.toString(),
            fallback: rawCallbackUrl,
          })
        }
      }

      const resolvedCallbackUrl = invitation_id ? `/join/${invitation_id}` : rawCallbackUrl
      const res = await signIn(
        provider,
        {
          csrfToken: csrfToken,
          redirect: false,
          callbackUrl: resolvedCallbackUrl,
        },
        new URLSearchParams({
          email: email?.toString() || '',
          invitation_id: invitation_id?.toString() || '',
          locale: locale || defaultLocale || '',
          // so far we need to add the keycloak specific query parameter here as there is no other possiblity to map the locale somewhere else
          kc_locale: locale || defaultLocale || '',
        }),
      )

      setIsSubmitting(false)

      if (!res?.error && res?.url) {
        plausible('auth.login.success', {
          props: {
            provider: provider === 'credentials' ? 'internal' : 'oauth',
          },
        })

        setSelectedDate(formatISOLocale(new Date()))

        // Validate the redirect URL - if it's not a known route, redirect to home instead
        const redirectUrl = getValidRouteOrFallback(res.url, ROUTES.USER.INDEX)

        logger.info('[Login] Attempting redirect to:', res.url)
        if (redirectUrl !== res.url) {
          logger.warn('[Login] Invalid route detected, redirecting to home instead:', {
            attempted: res.url,
            redirecting: redirectUrl,
          })
        }

        await router.push(redirectUrl)
        logger.info('[Login] Router.push completed, current pathname:', router.pathname)
      } else {
        plausible('auth.login.error', {
          props: {
            provider: provider === 'credentials' ? 'internal' : 'oauth',
            error: res?.error || 'unknown_error',
          },
        })

        logger.warn('[Login] Sign in failed or no URL returned:', {
          error: res?.error,
          url: res?.url,
        })
      }
    },
    [
      csrfToken,
      email,
      invitation_id,
      plausible,
      router,
      setSelectedDate,
      locale,
      defaultLocale,
      callbackUrl,
    ],
  )

  useEffect(() => {
    if (providers.length === 1 && !error) {
      void signInToProvider(providers[0].id)
    }
  }, [providers, signInToProvider, error])

  if (providers.length === 1 && !error) {
    return (
      <AuthLayout infoPanel={<LoadingInfoPanel />}>
        <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
          <CardBody className="items-center gap-4 p-8">
            <div className="mb-4 flex justify-center lg:hidden">
              <Logo />
            </div>
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-base-content/70 text-center">
              {t('auth.preparingSecureLogin', { defaultValue: 'Preparing secure login...' })}
            </p>
          </CardBody>
        </Card>
      </AuthLayout>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lasius.io'
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent('Lasius')}&subtitle=${encodeURIComponent('Open source time tracking for teams')}`

  return (
    <>
      <NextSeo
        title="Sign in to Lasius"
        description="Lasius - Open source time tracking for teams. Sign in to track your time and manage projects."
        canonical={`${baseUrl}/login`}
        openGraph={{
          url: `${baseUrl}/login`,
          title: 'Sign in to Lasius',
          description:
            'Lasius - Open source time tracking for teams. Sign in to track your time and manage projects.',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: 'Lasius - Open source time tracker for teams',
            },
          ],
          siteName: 'Lasius',
          type: 'website',
          locale: locale || defaultLocale || 'en',
        }}
        twitter={{
          handle: '@tegonal',
          site: '@tegonal',
          cardType: 'summary_large_image',
        }}
      />
      <AuthLayout infoPanel={<LoginInfoPanel />}>
        {/* Error Alert */}
        {error && (
          <Alert variant="warning" className="animate-[fadeIn_0.4s_ease-out]">
            {getErrorMessage(error)}
          </Alert>
        )}

        {/* No providers warning */}
        {providers.length === 0 && (
          <Card className="border-warning bg-warning/5 backdrop-blur-sm">
            <CardBody className="items-center gap-4">
              <div className="flex justify-center lg:hidden">
                <Logo />
              </div>
              <div className="text-warning">
                <LucideIcon icon={AlertTriangle} size={48} />
              </div>
              <p className="text-center font-medium">
                {t('auth.noAuthMethodsAvailable', {
                  defaultValue: 'No authentication methods available',
                })}
              </p>
              <p className="text-base-content/70 text-center text-sm">
                {t('help.contactAdmin', { defaultValue: 'Please contact your administrator' })}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Main login card */}
        {providers.length > 0 && (
          <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
            <CardBody className="p-8 lg:p-10">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-3xl font-bold">
                  {t('auth.signInTitle', { defaultValue: 'Sign in to your account' })}
                </h2>
                <p className="text-base-content/60">
                  {providers.length > 1
                    ? t('auth.chooseMethod', { defaultValue: 'Choose your preferred method below' })
                    : t('auth.continueWithProvider', {
                        defaultValue: 'Continue with your account',
                      })}
                </p>
              </div>

              {/* Provider buttons */}
              <div className="space-y-3">
                {providers.map((provider) => {
                  let icon = undefined
                  if (provider.custom_logo) {
                    // Use LasiusIcon component for lasius.svg to respect currentColor
                    if (provider.custom_logo.includes('lasius.svg')) {
                      icon = <LasiusIcon size={24} />
                    } else {
                      icon = (
                        <Image
                          alt={provider.name}
                          src={provider.custom_logo}
                          width={24}
                          height={24}
                        />
                      )
                    }
                  } else {
                    switch (provider.id) {
                      case AUTH_PROVIDER_INTERNAL_LASIUS:
                        icon = <LasiusIcon size={24} />
                        break
                      case 'gitlab':
                        icon = <SiGitlab />
                        break
                      case 'github':
                        icon = <SiGithub />
                        break
                      case AUTH_PROVIDER_CUSTOMER_KEYCLOAK:
                        icon = <SiKeycloak />
                        break
                    }
                  }

                  return (
                    <Button
                      key={provider.id}
                      disabled={isSubmitting}
                      onClick={() => signInToProvider(provider.id)}
                      variant="outline"
                      size="lg"
                      className={`hover:border-primary hover:bg-base-200 w-full justify-start gap-3 transition-colors duration-200 ${isSubmitting ? 'opacity-50' : ''}`}>
                      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
                      <span className="flex-1 text-left">
                        {t('auth.continueWith', { defaultValue: 'Continue with' })}{' '}
                        <span className="font-semibold">{provider.name}</span>
                      </span>
                    </Button>
                  )
                })}
              </div>

              {/* Help button */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <HelpButton />
                <p className="text-base-content/50 text-center text-sm">
                  {t('auth.needHelp', { defaultValue: 'Need help? Click the help button' })}
                </p>
              </div>
            </CardBody>
          </Card>
        )}
      </AuthLayout>
    </>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Validate and clean the callbackUrl query parameter before NextAuth sees it
  const callbackUrl = context.query.callbackUrl?.toString()
  if (callbackUrl) {
    const validatedUrl = getValidRouteOrFallback(
      callbackUrl,
      ROUTES.USER.INDEX,
      `http://${context.req.headers.host}`,
    )
    if (validatedUrl !== callbackUrl) {
      logger.warn('[Login SSR] Invalid callbackUrl in query, redirecting with valid URL:', {
        original: callbackUrl,
        validated: validatedUrl,
      })
      // Redirect back to login with the validated callbackUrl
      return {
        redirect: {
          destination: `/login?callbackUrl=${encodeURIComponent(validatedUrl)}${context.query.error ? `&error=${context.query.error}` : ''}`,
          permanent: false,
        },
      }
    }
  }

  return getServerSidePropsWithoutAuth(context, async (_context, _locale) => {
    const providers = Object.values((await getProviders()) || [])

    let config
    try {
      config = await getConfiguration()
    } catch (error) {
      logger.error('[Login] Failed to fetch configuration from backend:', error)
      // Provide a default config when backend is unavailable
      config = {
        lasiusOAuthProviderEnabled: false,
        lasiusOAuthProviderAllowUserRegistration: false,
      }
    }

    const availableProviders = providers
      .filter((p) => p.id !== AUTH_PROVIDER_INTERNAL_LASIUS || config.lasiusOAuthProviderEnabled)
      .map((p) => {
        if (p.id === AUTH_PROVIDER_CUSTOMER_KEYCLOAK) {
          ;(p as CustomizedClientSafeProvider).custom_logo =
            process.env.KEYCLOAK_OAUTH_PROVIDER_ICON || null
        } else {
          ;(p as CustomizedClientSafeProvider).custom_logo = null
        }
        return p
      })

    return {
      csrfToken: await getCsrfToken(context),
      providers: availableProviders,
    }
  })
}

export default Login
