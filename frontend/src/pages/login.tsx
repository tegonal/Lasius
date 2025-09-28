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
import { LoginLayout } from 'components/features/login/loginLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { Icon } from 'components/ui/icons/Icon'
import { Logo } from 'components/ui/icons/Logo'
import { HelpButton } from 'components/ui/navigation/HelpButton'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { t } from 'i18next'
import { getConfiguration } from 'lib/api/lasius/general/general'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { getLocaleFromCookie } from 'lib/utils/auth/getLocaleFromCookie'
import { formatISOLocale } from 'lib/utils/date/dates'
import { GetServerSidePropsContext, NextPage } from 'next'
import { ClientSafeProvider, getCsrfToken, getProviders, signIn } from 'next-auth/react'
import { Trans, useTranslation } from 'next-i18next'
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

  if (providers.length === 1 && !error) {
    return (
      <LoginLayout>
        <Card className="w-full max-w-md animate-pulse">
          <CardBody className="items-center gap-4">
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="h-4" />
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-base-content/70 text-center">
              {t('auth.preparingSecureLogin', { defaultValue: 'Preparing secure login...' })}
            </p>
          </CardBody>
        </Card>
      </LoginLayout>
    )
  } else {
    return (
      <LoginLayout>
        {error && (
          <Alert variant="warning" className="max-w-md">
            <Trans t={t} i18nKey="auth.errors.general" defaults="{error}" values={{ error }}>
              {error}
            </Trans>
          </Alert>
        )}
        {providers.length === 0 && (
          <Card variant="bordered" className="border-warning w-full max-w-md">
            <CardBody className="items-center gap-4">
              <div className="flex justify-center">
                <Logo />
              </div>
              <div className="h-4" />
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
        {providers.length > 0 && (
          <Card shadow="xl" className="border-base-300 bg-base-100 w-full max-w-md border">
            <CardBody className="gap-6 p-8">
              <div className="flex justify-center">
                <Logo />
              </div>
              <div className="h-4" />
              <div className="w-full space-y-3 text-center">
                <p className="text-xl font-semibold">
                  {providers.length > 1
                    ? t('auth.welcomeToLasius', { defaultValue: 'Welcome to Lasius' })
                    : t('auth.signInToContinue', { defaultValue: 'Sign in to continue' })}
                </p>
                {providers.length > 1 && (
                  <p className="text-base-content/70 text-center text-sm">
                    {t('auth.choosePreferredLoginMethod', {
                      defaultValue: 'Choose your preferred login method',
                    })}
                  </p>
                )}
              </div>
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
                      variant="outline"
                      size="lg"
                      className="border-base-300 hover:border-primary hover:bg-base-200 w-full justify-center gap-3 transition-all duration-200">
                      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
                      <span className="text-center">
                        {t('auth.continueWith', { defaultValue: 'Continue with' })}{' '}
                        <span className="font-semibold">
                          <Trans
                            t={t}
                            i18nKey="auth.providerName"
                            defaults="{name}"
                            values={{ name: provider.name }}>
                            {provider.name}
                          </Trans>
                        </span>
                      </span>
                    </Button>
                  )
                })}
              </div>
              <div className="flex flex-col items-center gap-2 pt-4">
                <HelpButton />
                <p className="text-base-content/50 text-center text-sm">
                  {t('auth.needHelp', { defaultValue: 'Need help? Click the help button' })}
                </p>
              </div>
            </CardBody>
          </Card>
        )}
        <TegonalFooter />
      </LoginLayout>
    )
  }
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
    console.error('Failed to fetch configuration from backend:', error)
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

export default Login
