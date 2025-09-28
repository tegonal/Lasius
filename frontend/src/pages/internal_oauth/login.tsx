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

import { LoginLayout } from 'components/features/login/loginLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { P } from 'components/primitives/typography/Paragraph'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { FormBody } from 'components/ui/forms/formBody'
import { FormButtonContainer } from 'components/ui/forms/formButtonContainer'
import { FormElement } from 'components/ui/forms/formElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { Logo } from 'components/ui/icons/Logo'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { LoginError } from 'dynamicTranslationStrings'
import { ModelsApplicationConfig } from 'lib/api/lasius'
import { getConfiguration } from 'lib/api/lasius/general/general'
import { getLoginMutationKey } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { logger } from 'lib/logger'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { isEmailAddress } from 'lib/utils/data/validators'
import { formatISOLocale } from 'lib/utils/date/dates'
import { GetServerSideProps, NextPage } from 'next'
import { Trans, useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { LASIUS_API_URL, LASIUS_DEMO_MODE } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCalendarActions } from 'stores/calendarStore'

const InternalOAuthLogin: NextPage<{ config: ModelsApplicationConfig; locale?: string }> = ({
  config,
  locale,
}) => {
  const plausible = usePlausible<LasiusPlausibleEvents>()
  const { setSelectedDate } = useCalendarActions()
  const [error, setError] = useState<keyof typeof LoginError>()
  const { t } = useTranslation('common')
  const router = useRouter()
  const {
    email = undefined,
    invitation_id = undefined,
    registered = null,
    redirect_uri = '',
    client_id = '',
    scope = '',
    code_challenge = undefined,
    code_challenge_method = undefined,
    state = undefined,
  } = router.query

  const {
    register,
    handleSubmit,
    setFocus,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: { email: email || '', password: '' },
  })

  useEffect(() => {
    setFocus('email')
  }, [setFocus])

  const onSubmit = async () => {
    plausible('internalOAuthLogin', {
      props: {
        status: 'start',
      },
    })

    const data = getValues()
    setError(undefined)

    // We need to use fetch here as on client side the
    // browser will automatically follow the redirect when resolving the
    // XHTMLRequest and return this result instead
    const res = await fetch(LASIUS_API_URL + getLoginMutationKey()[0], {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        clientId: client_id.toString(),
        email: data.email.toString(),
        password: data.password.toString(),
        redirectUri: redirect_uri.toString(),
        scope: scope.toString(),
        codeChallenge: code_challenge?.toString(),
        codeChallengeMethod: code_challenge_method?.toString(),
        state: state?.toString(),
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })

    if (res?.status === 401) {
      setError('usernameOrPasswordWrong')
      setValue('password', '')
      setFocus('email')
      plausible('internalOAuthLogin', {
        props: {
          status: 'failed',
        },
      })
      logger.info(res)
    } else if (res?.ok && res?.url) {
      plausible('internalOAuthLogin', {
        props: {
          status: 'success',
        },
      })

      setSelectedDate(formatISOLocale(new Date()))

      // force redirect through browser to correctly re-initialize users session
      window.location.href = res.url
    }
  }

  const onRegister = async () => {
    // login user and handle invitation logic again
    const url =
      '/internal_oauth/register?' +
      new URLSearchParams({
        invitation_id: invitation_id?.toString() || '',
        email: email?.toString() || '',
        locale: locale || '',
      })
    void router.replace(url)
  }

  return (
    <LoginLayout>
      {error && (
        <Alert variant="warning" className="max-w-md">
          {LoginError[error]}
        </Alert>
      )}
      {registered && (
        <Alert variant="info" className="max-w-md">
          {t('auth.thankYouForRegistering', {
            defaultValue:
              'Thank you for registering. You can now log in using your email address and password. Welcome to Lasius!',
          })}
        </Alert>
      )}
      {LASIUS_DEMO_MODE === 'true' && (
        <Alert variant="info" className="max-w-md">
          <div className="max-w-lg">
            <P>
              {t('demo.welcome', {
                defaultValue:
                  'Welcome to the Lasius demo instance. Use "demo1@lasius.ch" and password "demo" to log in and have a look around. The demo instance is reset once a day.',
              })}
            </P>
            <P>
              <Trans
                t={t}
                i18nKey="footer.feedbackOnGithub"
                defaults="We appreciate your feedback. Please leave a comment on <0>GitHub</0>"
                components={[
                  <a
                    key="gitHubLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/tegonal/lasius"
                    className="text-primary hover:underline"
                  />,
                ]}
              />
            </P>
          </div>
        </Alert>
      )}
      <Card shadow="xl" className="border-base-300 bg-base-100 w-full max-w-md border">
        <CardBody className="gap-6 p-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="h-4" />
          <div className="space-y-3 text-center">
            <p className="text-xl font-semibold">
              {t('auth.signInToLasius', { defaultValue: 'Sign in to Lasius' })}
            </p>
            <p className="text-base-content/70 text-sm">
              {t('auth.enterEmailAndPassword', {
                defaultValue: 'Enter your email and password to access your account',
              })}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormBody>
              <FormElement>
                <Label htmlFor="email">{t('common.forms.email', { defaultValue: 'E-Mail' })}</Label>
                <Input
                  {...register('email', {
                    required: true,
                    validate: { isEmailAddress: (v) => isEmailAddress(v.toString()) },
                  })}
                  autoComplete="off"
                  autoFocus
                  type="email"
                />
                <FormErrorBadge error={errors.email} />
              </FormElement>
              <FormElement>
                <Label htmlFor="password">
                  {t('common.forms.password', { defaultValue: 'Password' })}
                </Label>
                <Input
                  {...register('password', { required: true })}
                  type="password"
                  autoComplete="off"
                />
                <FormErrorBadge error={errors.password} />
              </FormElement>
              <FormButtonContainer>
                <Button type="submit" fullWidth>
                  {t('auth.signIn', { defaultValue: 'Sign in' })}
                </Button>
                {config.lasiusOAuthProviderAllowUserRegistration && (
                  <Button variant="ghost" onClick={() => onRegister()} fullWidth>
                    {t('common.actions.signUp', { defaultValue: 'Sign up' })}
                  </Button>
                )}
              </FormButtonContainer>
            </FormBody>
          </form>
        </CardBody>
      </Card>
      <TegonalFooter />
    </LoginLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale, query } = context
  const resolvedLocale = query.locale?.toString() || locale

  let config
  try {
    config = await getConfiguration()
  } catch (error) {
    console.error('Failed to fetch configuration from backend:', error)
    // Provide a default config when backend is unavailable
    config = {
      title: 'Lasius',
      instance: 'local',
      lasiusOAuthProviderEnabled: false,
      lasiusOAuthProviderAllowUserRegistration: false,
      allowedIssuers: [],
    }
  }

  return {
    props: {
      config: config,
      ...(await serverSideTranslations(resolvedLocale || '', ['common'])),
      locale: resolvedLocale,
    },
  }
}

export default InternalOAuthLogin
