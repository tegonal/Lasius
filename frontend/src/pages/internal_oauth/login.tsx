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

import { InternalLoginInfoPanel } from 'components/features/login/authInfoPanels'
import { AuthLayout } from 'components/features/login/authLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { P } from 'components/primitives/typography/Paragraph'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { Logo } from 'components/ui/icons/Logo'
import { LoginError } from 'dynamicTranslationStrings'
import { ModelsApplicationConfig } from 'lib/api/lasius'
import { getConfiguration } from 'lib/api/lasius/general/general'
import { getLoginMutationKey } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { getServerSidePropsWithoutAuth } from 'lib/auth/getServerSidePropsWithoutAuth'
import { logger } from 'lib/logger'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { isEmailAddress } from 'lib/utils/data/validators'
import { formatISOLocale } from 'lib/utils/date/dates'
import { GetServerSideProps, NextPage } from 'next'
import { Trans, useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { getLasiusApiUrl, getLasiusDemoMode } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCalendarActions } from 'stores/calendarStore'

const InternalOAuthLogin: NextPage<{ config: ModelsApplicationConfig }> = ({ config }) => {
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
    const data = getValues()
    setError(undefined)

    // We need to use fetch here as on client side the
    // browser will automatically follow the redirect when resolving the
    // XHTMLRequest and return this result instead
    const res = await fetch(getLasiusApiUrl() + getLoginMutationKey()[0], {
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
      plausible('auth.login.error', {
        props: {
          provider: 'internal',
          error: 'invalid_credentials',
        },
      })
      logger.info(res)
    } else if (res?.ok && res?.url) {
      plausible('auth.login.success', {
        props: {
          provider: 'internal',
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
      })
    void router.replace(url)
  }

  return (
    <AuthLayout infoPanel={<InternalLoginInfoPanel />}>
      {error && (
        <Alert variant="warning" className="animate-[fadeIn_0.4s_ease-out]">
          {LoginError[error]}
        </Alert>
      )}
      {registered && (
        <Alert variant="info" className="animate-[fadeIn_0.4s_ease-out]">
          {t('auth.thankYouForRegistering', {
            defaultValue:
              'Thank you for registering. You can now log in using your email address and password. Welcome to Lasius!',
          })}
        </Alert>
      )}
      {getLasiusDemoMode() === 'true' && (
        <Alert variant="info" className="animate-[fadeIn_0.4s_ease-out]">
          <div>
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
      <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardBody className="p-8 lg:p-10">
          <div className="mb-4 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">
              {t('auth.signInToLasius', { defaultValue: 'Sign in to Lasius' })}
            </h2>
            <p className="text-base-content/60 text-sm">
              {t('auth.enterEmailAndPassword', {
                defaultValue: 'Enter your email and password to access your account',
              })}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormBody>
              <FieldSet>
                <FormElement
                  label={t('common.forms.email', { defaultValue: 'Email' })}
                  htmlFor="email">
                  <Input
                    id="email"
                    {...register('email', {
                      required: true,
                      validate: { isEmailAddress: (v) => isEmailAddress(v.toString()) },
                    })}
                    aria-describedby="email-error"
                    autoComplete="email"
                    autoFocus
                    type="email"
                  />
                  <FormErrorBadge id="email-error" error={errors.email} />
                </FormElement>
                <FormElement
                  label={t('common.forms.password', { defaultValue: 'Password' })}
                  htmlFor="password">
                  <Input
                    id="password"
                    {...register('password', { required: true })}
                    aria-describedby="password-error"
                    type="password"
                    autoComplete="current-password"
                  />
                  <FormErrorBadge id="password-error" error={errors.password} />
                </FormElement>
              </FieldSet>
              <ButtonGroup>
                <Button type="submit" fullWidth>
                  {t('auth.signIn', { defaultValue: 'Sign in' })}
                </Button>
                {config.lasiusOAuthProviderAllowUserRegistration && (
                  <Button variant="ghost" onClick={() => onRegister()} fullWidth>
                    {t('common.actions.signUp', { defaultValue: 'Sign up' })}
                  </Button>
                )}
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithoutAuth(context, async (_context, _locale) => {
    let config
    try {
      config = await getConfiguration()
    } catch (error) {
      logger.error('[InternalOAuth][Login] Failed to fetch configuration from backend:', error)
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
      config: config,
    }
  })
}

export default InternalOAuthLogin
