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
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { Icon } from 'components/ui/icons/Icon'
import { Logo } from 'components/ui/icons/Logo'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { t } from 'i18next'
import { getConfiguration } from 'lib/api/lasius/general/general'
import { logger } from 'lib/logger'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { getLocaleFromCookie } from 'lib/utils/auth/getLocaleFromCookie'
import { formatISOLocale } from 'lib/utils/date/dates'
import { BarChart3, Calendar, Clock, Shield, Users, Zap } from 'lucide-react'
import { GetServerSidePropsContext, NextPage } from 'next'
import { ClientSafeProvider, getCsrfToken, getProviders, signIn } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
  AUTH_PROVIDER_INTERNAL_LASIUS,
} from 'projectConfig/constants'
import { useCallback, useEffect, useState } from 'react'
import { useCalendarActions } from 'stores/calendarStore'

type CustomizedClientSafeProvider = ClientSafeProvider & {
  custom_logo: string | null
}

// list of known error response codes, used to provide translations only
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loginErrorTranslations = [
  t('auth.errors.fetchProfileFailed', { defaultValue: 'fetchProfileFailed' }),
  t('auth.errors.oauthCallback', { defaultValue: 'OAuthCallbackError' }),
]

const LoginModernTest: NextPage<{
  csrfToken: string
  providers: CustomizedClientSafeProvider[]
  locale?: string
  defaultLocale?: string
}> = ({ csrfToken, providers, locale, defaultLocale }) => {
  const plausible = usePlausible<LasiusPlausibleEvents>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null)
  const { t } = useTranslation('common')
  const router = useRouter()
  const { setSelectedDate } = useCalendarActions()
  const { invitation_id = null, email = null, error = null, callbackUrl = null } = router.query

  const signInToProvider = useCallback(
    async (provider: string) => {
      plausible('login', {
        props: {
          status: 'start',
          provider: provider,
        },
      })

      setIsSubmitting(true)

      const localePath = `${locale ? '/' + locale : ''}`
      const resolvedCallbackUrl = invitation_id
        ? `${localePath}/join/${invitation_id}`
        : callbackUrl?.toString() || `${localePath}/user/home`
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
        plausible('login', {
          props: {
            status: 'success',
            provider: provider,
          },
        })

        setSelectedDate(formatISOLocale(new Date()))
        await router.push(res.url)
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

  // Feature highlights for the left panel
  const features = [
    { icon: Clock, text: t('features.trackTime', { defaultValue: 'Track time effortlessly' }) },
    {
      icon: Users,
      text: t('features.collaborateTeam', { defaultValue: 'Collaborate with your team' }),
    },
    {
      icon: BarChart3,
      text: t('features.insightfulReports', { defaultValue: 'Insightful reports & analytics' }),
    },
    {
      icon: Calendar,
      text: t('features.flexibleScheduling', { defaultValue: 'Flexible scheduling' }),
    },
  ]

  if (providers.length === 1 && !error) {
    return (
      <div className="flex min-h-screen w-full">
        {/* Left Panel - Hidden on mobile */}
        <div className="bg-primary relative hidden items-center justify-center overflow-hidden lg:flex lg:w-1/2">
          <div className="text-primary-content relative z-10 max-w-lg p-12">
            <Logo className="text-primary-content mb-16 h-16 w-auto" />
            <h1 className="mb-4 text-4xl font-bold">
              {t('auth.connectingSecurely', { defaultValue: 'Connecting you securely' })}
            </h1>
            <div className="loading loading-dots loading-lg"></div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-base-100 flex w-full items-center justify-center p-8 lg:w-1/2">
          <Card className="w-full max-w-md animate-pulse border-0 shadow-none">
            <CardBody className="items-center gap-4">
              <div className="mb-4 flex justify-center lg:hidden">
                <Logo />
              </div>
              <div className="loading loading-spinner loading-lg text-primary"></div>
              <p className="text-base-content/70 text-center">
                {t('auth.preparingSecureLogin', { defaultValue: 'Preparing secure login...' })}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Brand & Features */}
      <div className="bg-primary relative hidden items-center justify-center overflow-hidden lg:flex lg:w-1/2">
        {/* Floating shapes for visual interest */}
        <div className="bg-primary-content/5 absolute top-20 left-20 h-64 w-64 rounded-full blur-3xl"></div>
        <div className="bg-primary-content/5 absolute right-20 bottom-20 h-96 w-96 rounded-full blur-3xl"></div>

        <div className="text-primary-content relative z-10 max-w-lg p-12">
          <Logo className="text-primary-content mb-16 h-16 w-auto" />
          <h1 className="mb-4 text-4xl font-bold">
            {t('auth.welcomeBackTitle', { defaultValue: 'Welcome to Lasius' })}
          </h1>
          <p className="mb-8 text-xl opacity-90">
            {t('auth.tagline', { defaultValue: 'Open source time tracking for modern teams' })}
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex animate-[fadeInUp_0.6s_ease-out_forwards] items-center gap-3 opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}>
                <div className="bg-primary-content/10 rounded-lg p-2 backdrop-blur-sm">
                  <LucideIcon icon={feature.icon} size={20} />
                </div>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="border-primary-content/20 mt-12 border-t pt-8">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <LucideIcon icon={Shield} size={16} />
              <span>{t('auth.secureAndPrivate', { defaultValue: 'Secure & Private' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="from-base-100 to-base-200/30 flex w-full items-center justify-center bg-gradient-to-b p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-12 w-auto" />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="warning" className="animate-[fadeIn_0.4s_ease-out]">
              {error}
            </Alert>
          )}

          {/* No providers warning */}
          {providers.length === 0 && (
            <Card className="border-warning bg-warning/5 backdrop-blur-sm">
              <CardBody className="items-center gap-4">
                <div className="text-warning">
                  <Icon name="alert-triangle" size={48} />
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
                      ? t('auth.chooseMethod', {
                          defaultValue: 'Choose your preferred method below',
                        })
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
                      icon = (
                        <Image
                          alt={provider.name}
                          src={provider.custom_logo}
                          width={24}
                          height={24}
                        />
                      )
                    } else {
                      switch (provider.id) {
                        case AUTH_PROVIDER_INTERNAL_LASIUS:
                          icon = <Icon name="lasius" size={24} />
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
                        onMouseEnter={() => setHoveredProvider(provider.id)}
                        onMouseLeave={() => setHoveredProvider(null)}
                        variant={hoveredProvider === provider.id ? 'primary' : 'outline'}
                        size="lg"
                        className={`w-full justify-start gap-3 transition-colors duration-200 ${isSubmitting ? 'opacity-50' : ''} `}>
                        <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
                        <span className="flex-1 text-left">
                          {t('auth.continueWith', { defaultValue: 'Continue with' })}{' '}
                          <span className="font-semibold">{provider.name}</span>
                        </span>
                        <LucideIcon
                          icon={Zap}
                          size={16}
                          className={`transition-opacity ${hoveredProvider === provider.id ? 'opacity-100' : 'opacity-0'}`}
                        />
                      </Button>
                    )
                  })}
                </div>

                {/* Help link */}
                <div className="mt-6 text-center">
                  <button className="text-primary text-sm hover:underline">
                    {t('auth.troubleSigningIn', { defaultValue: 'Having trouble signing in?' })}
                  </button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Footer */}
          <div className="pt-4 text-center">
            <TegonalFooter />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query } = context
  // Without i18n config, context.locale doesn't exist - we must use our helper
  const locale = getLocaleFromCookie(context)
  const resolvedLocale = query.locale?.toString() || locale
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
    props: {
      csrfToken: await getCsrfToken(context),
      providers: availableProviders,
      ...(await serverSideTranslations(resolvedLocale || 'en', ['common'])),
      locale: resolvedLocale,
    },
  }
}

export default LoginModernTest
