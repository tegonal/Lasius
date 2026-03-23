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

import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { Trans, useTranslation } from 'react-i18next'
import {
  data,
  Form,
  href,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { Logo } from '~/components/ui/icons/logo'
import { InternalLoginInfoPanel } from '~/features/auth/auth-info-panels'
import { AuthLayout } from '~/features/auth/auth-layout'
import { getServerEnv } from '~/lib/env.server'
import { type SchemaTranslationFn } from '~/lib/i18n-types'
import { logger } from '~/lib/logger'
import { getConfiguration } from '~/services/api/lasius/general/general'
import {
  getOptionalUser,
  sanitizeReturnTo,
} from '~/services/auth/auth-helpers.server'
import { getInternalProvider } from '~/services/auth/providers'
import { createUserSession } from '~/services/auth/session.server'

import { type Route } from './+types/internal-oauth.login'

const createLoginSchema = (t: SchemaTranslationFn) =>
  z.object({
    email: z
      .string({
        error: t('common.validation.required', { defaultValue: 'Required' }),
      })
      .email(
        t('common.validation.emailInvalid', {
          defaultValue: 'Invalid email address',
        }),
      ),
    password: z
      .string({
        error: t('common.validation.required', { defaultValue: 'Required' }),
      })
      .min(1, t('common.validation.required', { defaultValue: 'Required' })),
    returnTo: z.string().default('/'),
  })

// Server-side schema with English defaults
const serverLoginSchema = createLoginSchema(
  (_, opts) => opts?.defaultValue ?? '',
)

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: serverLoginSchema })

  if (submission.status !== 'success') {
    return data(
      { lastResult: submission.reply(), serverError: null },
      { status: 400 },
    )
  }

  const { email, password, returnTo } = submission.value

  try {
    const provider = getInternalProvider()
    const result = await provider.loginWithCredentials(email.trim(), password)

    logger.debug('Internal login successful', {
      email: result.profile.email,
    })

    return createUserSession(
      {
        accessToken: result.tokens.access_token,
        email: result.profile.email,
        expiresAt: Date.now() + result.tokens.expires_in * 1000,
        issuedAt: Date.now(),
        refreshToken: result.tokens.refresh_token ?? '',
        tokenIssuer: 'internal',
        userId: result.profile.userId,
      },
      returnTo,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    logger.warn('Internal login failed', { email, error: message })

    const errorCode =
      message === 'Invalid credentials'
        ? 'usernameOrPasswordWrong'
        : 'loginFailed'

    return data(
      { lastResult: submission.reply(), serverError: errorCode },
      { status: message === 'Invalid credentials' ? 401 : 500 },
    )
  }
}

export default function InternalOAuthLogin() {
  const {
    allowRegistration,
    demoMode,
    email: prefilledEmail,
    invitationId,
    registered,
    returnTo,
  } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const { t } = useTranslation('common')

  const loginSchema = createLoginSchema(t)

  const [form, fields] = useForm({
    defaultValue: { email: prefilledEmail, password: '', returnTo },
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  const isSubmitting = navigation.state !== 'idle'

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'usernameOrPasswordWrong':
        return t('auth.errors.invalidCredentials', {
          defaultValue: 'Invalid email or password. Please try again.',
        })
      case 'loginFailed':
      default:
        return t('auth.errors.loginFailed', {
          defaultValue: 'Login failed. Please try again.',
        })
    }
  }

  return (
    <AuthLayout infoPanel={<InternalLoginInfoPanel />}>
      {registered && (
        <Alert
          className="animate-[fadeIn_0.4s_ease-out]"
          data-testid="auth-internal-registered-success"
          variant="success"
        >
          {t('auth.registrationSuccess', {
            defaultValue:
              'Thank you for registering. You can now sign in with your credentials.',
          })}
        </Alert>
      )}
      {actionData?.serverError && (
        <Alert
          className="animate-[fadeIn_0.4s_ease-out]"
          data-testid="auth-internal-login-error"
          variant="warning"
        >
          {getErrorMessage(actionData.serverError)}
        </Alert>
      )}
      {demoMode && (
        <Alert className="animate-[fadeIn_0.4s_ease-out]" variant="info">
          <div>
            <p>
              {t('demo.welcome', {
                defaultValue:
                  'Welcome to the Lasius demo instance. Use "demo1@lasius.ch" and password "demo" to log in and have a look around. The demo instance is reset once a day.',
              })}
            </p>
            <p>
              <Trans
                components={[
                  <a
                    className="text-primary hover:underline"
                    href="https://github.com/tegonal/lasius"
                    key="gitHubLink"
                    rel="noopener noreferrer"
                    target="_blank"
                  />,
                ]}
                defaults="We appreciate your feedback. Please leave a comment on <0>GitHub</0>"
                i18nKey="footer.feedbackOnGithub"
                t={t}
              />
            </p>
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
              {t('auth.signInToLasius', {
                defaultValue: 'Sign in to Lasius',
              })}
            </h2>
            <p className="text-base-content/60 text-sm">
              {t('auth.enterEmailAndPassword', {
                defaultValue:
                  'Enter your email and password to access your account',
              })}
            </p>
          </div>
          <Form method="post" {...getFormProps(form)}>
            <input
              {...getInputProps(fields.returnTo, { type: 'hidden' })}
              key={fields.returnTo.key}
            />
            <FormBody>
              <FieldSet>
                <FormElement
                  htmlFor={fields.email.id}
                  label={t('common.forms.email', {
                    defaultValue: 'Email',
                  })}
                >
                  <Input
                    autoComplete="email"
                    autoFocus
                    data-testid="auth-internal-email-input"
                    error={!!fields.email.errors?.length}
                    {...getInputProps(fields.email, { type: 'email' })}
                    key={fields.email.key}
                  />
                  <FormFieldErrors errors={fields.email.errors} />
                </FormElement>
                <FormElement
                  htmlFor={fields.password.id}
                  label={t('common.forms.password', {
                    defaultValue: 'Password',
                  })}
                >
                  <Input
                    autoComplete="current-password"
                    data-testid="auth-internal-password-input"
                    error={!!fields.password.errors?.length}
                    {...getInputProps(fields.password, { type: 'password' })}
                    key={fields.password.key}
                  />
                  <FormFieldErrors errors={fields.password.errors} />
                </FormElement>
              </FieldSet>
              <ButtonGroup>
                <Button
                  data-testid="auth-internal-submit-btn"
                  fullWidth
                  loading={isSubmitting}
                  type="submit"
                >
                  {t('auth.signIn', {
                    defaultValue: 'Sign in',
                  })}
                </Button>
                {allowRegistration && (
                  <a
                    data-testid="auth-internal-signup-btn"
                    href={(() => {
                      const params = new URLSearchParams()
                      if (invitationId)
                        params.set('invitation_id', invitationId)
                      if (returnTo) params.set('returnTo', returnTo)
                      const qs = params.toString()
                      return `${href('/internal-oauth/register')}${qs ? `?${qs}` : ''}`
                    })()}
                  >
                    <Button fullWidth type="button" variant="secondary">
                      {t('common.actions.signUp', {
                        defaultValue: 'Sign up',
                      })}
                    </Button>
                  </a>
                )}
              </ButtonGroup>
            </FormBody>
          </Form>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request)
  const url = new URL(request.url)
  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo') ?? '/')

  if (user) {
    throw redirect(returnTo)
  }

  const demoMode = getServerEnv('LASIUS_DEMO_MODE') === 'true'
  const email = url.searchParams.get('email') ?? ''
  const invitationId = url.searchParams.get('invitation_id') ?? ''
  const registered = url.searchParams.get('registered') === 'true'

  let allowRegistration = false
  try {
    const config = await getConfiguration()
    allowRegistration =
      config.data.lasiusOAuthProviderAllowUserRegistration ?? false
  } catch (error) {
    logger.warn('Failed to fetch configuration', error)
  }

  return {
    allowRegistration,
    demoMode,
    email,
    invitationId,
    registered,
    returnTo,
  }
}
