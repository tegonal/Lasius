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

import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  data,
  Form,
  Link,
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
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { RegisterInfoPanel } from '~/features/auth/auth-info-panels'
import { AuthLayout } from '~/features/auth/auth-layout'
import { getRegisterDefaults, type RegisterFormValues } from '~/features/auth/lib/register-form'
import { type SchemaTranslationFunction, untyped } from '~/lib/i18n-types'
import { logger } from '~/lib/logger'
import { toApiError } from '~/services/api/lasius-fetch-instance'
import { registerOAuthUser } from '~/services/api/lasius/oauth2-provider/oauth2-provider'
import { redirectIfSignedIn } from '~/services/auth/auth-helpers.server'
import { internalLoginUrl } from '~/services/auth/auth-urls'
import { sanitizeReturnTo } from '~/services/auth/return-to'

import { type Route } from './+types/internal-oauth.register'

const createRegisterSchema = (t: SchemaTranslationFunction) =>
  z
    .object({
      confirmPassword: z
        .string({
          error: t('validation.required', { defaultValue: 'Required' }),
        })
        .min(1, t('validation.required', { defaultValue: 'Required' })),
      email: z.email({
        error: (issue) =>
          issue.code === 'invalid_type'
            ? t('validation.required', { defaultValue: 'Required' })
            : t('validation.emailInvalid', {
                defaultValue: 'Invalid email address',
              }),
      }),
      firstName: z
        .string({
          error: t('validation.required', { defaultValue: 'Required' }),
        })
        .min(1, t('validation.required', { defaultValue: 'Required' })),
      invitationId: z.string().optional(),
      lastName: z
        .string({
          error: t('validation.required', { defaultValue: 'Required' }),
        })
        .min(1, t('validation.required', { defaultValue: 'Required' })),
      password: z
        .string({
          error: t('validation.required', { defaultValue: 'Required' }),
        })
        .min(
          9,
          t('validation.passwordTooShort', {
            defaultValue: 'Minimum 9 characters',
          }),
        )
        .regex(/[A-Z]/, {
          error: t('validation.missingUppercase', {
            defaultValue: 'Must contain uppercase letter',
          }),
        })
        .regex(/\d/, {
          error: t('validation.missingNumber', {
            defaultValue: 'Must contain a number',
          }),
        }),
      returnTo: z.string().optional(),
    })
    .refine((value) => value.password === value.confirmPassword, {
      error: t('validation.passwordMismatch', {
        defaultValue: 'Passwords do not match',
      }),
      path: ['confirmPassword'],
    })

// Server-side schema with English defaults
const serverRegisterSchema = createRegisterSchema((_, defaultValue) =>
  typeof defaultValue === 'string' ? defaultValue : defaultValue.defaultValue,
)

type RegisterAlertsProperties = {
  invitationId: string
  serverError: null | string | undefined
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: serverRegisterSchema })

  if (submission.status !== 'success') {
    return data({ lastResult: submission.reply(), serverError: null }, { status: 400 })
  }

  const { email, firstName, invitationId, lastName, password, returnTo } = submission.value

  try {
    await registerOAuthUser({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
    })

    return redirect(
      internalLoginUrl({
        email: email.trim(),
        invitation_id: invitationId,
        registered: true,
        returnTo: sanitizeReturnTo(returnTo),
      }),
    )
  } catch (error) {
    const apiError = await toApiError(error)
    const body = apiError ? String(apiError.body) : ''

    logger.warn('Registration failed', {
      email,
      error: apiError ? `${apiError.status}: ${body}` : String(error),
    })

    const errorCode = body.includes('user_already_registered')
      ? 'user_already_registered'
      : 'register_unknown'

    return data(
      {
        lastResult: submission.reply(),
        serverError: errorCode,
      },
      {
        status: errorCode === 'user_already_registered' ? 409 : 500,
      },
    )
  }
}

export default function InternalOAuthRegister() {
  const { email, invitationId, returnTo } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const { t } = useTranslation('common')
  const [showPasswords, setShowPasswords] = useState(false)

  const backToLoginHref = internalLoginUrl({
    invitation_id: invitationId,
    returnTo,
  })

  const registerSchema = createRegisterSchema(untyped(t))

  const [form, fields] = useForm<RegisterFormValues>({
    defaultValue: getRegisterDefaults({ email, invitationId, returnTo }),
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: registerSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  const passwordType = showPasswords ? 'text' : 'password'

  return (
    <AuthLayout infoPanel={<RegisterInfoPanel />}>
      <RegisterAlerts invitationId={invitationId} serverError={actionData?.serverError} />
      <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardBody className="p-8 lg:p-10">
          <Link className="flex items-center gap-1 self-center text-sm" to={backToLoginHref}>
            <ChevronLeft size={16} />
            {t('auth.errors.backToLogin', {
              defaultValue: 'Back to Login',
            })}
          </Link>
          <div className="mb-4 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">
              {t('auth.createYourAccount', {
                defaultValue: 'Create your account',
              })}
            </h2>
            <p className="text-base-content/60 text-sm">
              {t('auth.fillDetailsToStart', {
                defaultValue: 'Please fill in your details to get started',
              })}
            </p>
          </div>
          <Form method="post" {...getFormProps(form)}>
            <RegisterHiddenFields
              invitationField={fields.invitationId}
              invitationId={invitationId}
              returnTo={returnTo}
              returnToField={fields.returnTo}
            />
            <FormBody>
              <FieldSet>
                <RegisterField
                  autoComplete="email"
                  field={fields.email}
                  label={t('forms.email', {
                    defaultValue: 'Email',
                  })}
                  testId="auth-register-email-input"
                  type="email"
                />
                <RegisterField
                  autoComplete="given-name"
                  field={fields.firstName}
                  label={t('forms.firstName', {
                    defaultValue: 'First name',
                  })}
                  testId="auth-register-firstname-input"
                  type="text"
                />
                <RegisterField
                  autoComplete="family-name"
                  field={fields.lastName}
                  label={t('forms.lastName', {
                    defaultValue: 'Last name',
                  })}
                  testId="auth-register-lastname-input"
                  type="text"
                />
                <RegisterField
                  autoComplete="new-password"
                  field={fields.password}
                  label={t('forms.password', {
                    defaultValue: 'Password',
                  })}
                  testId="auth-register-password-input"
                  type={passwordType}
                />
                <RegisterField
                  autoComplete="new-password"
                  field={fields.confirmPassword}
                  label={t('forms.confirmPassword', {
                    defaultValue: 'Confirm password',
                  })}
                  testId="auth-register-confirmpassword-input"
                  type={passwordType}
                />
              </FieldSet>
              <ButtonGroup>
                <ShowPasswordsButton
                  isShown={showPasswords}
                  onToggle={() => setShowPasswords(!showPasswords)}
                />
                <Button
                  data-testid="auth-register-submit-btn"
                  fullWidth
                  loading={navigation.state !== 'idle'}
                  type="submit">
                  {t('actions.signUp', {
                    defaultValue: 'Sign up',
                  })}
                </Button>
              </ButtonGroup>
            </FormBody>
          </Form>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

const RegisterAlerts = ({ invitationId, serverError }: RegisterAlertsProperties) => {
  const { t } = useTranslation('common')
  return (
    <>
      {serverError && (
        <Alert
          className="animate-[fadeIn_0.4s_ease-out]"
          data-testid="auth-register-error"
          variant="warning">
          {serverError === 'user_already_registered'
            ? t('auth.errors.userAlreadyRegistered', {
                defaultValue: 'User already registered',
              })
            : t('auth.errors.registerUnknown', {
                defaultValue: 'Unknown registration error',
              })}
        </Alert>
      )}
      {invitationId && (
        <Alert className="animate-[fadeIn_0.4s_ease-out]" variant="info">
          {t('invitation:createAccountMessage', {
            defaultValue:
              'You have been invited to create an account so that you can use Lasius to track your working hours.',
          })}
        </Alert>
      )}
    </>
  )
}

type RegisterHiddenFieldsProperties = {
  invitationField: FieldMetadata<string | undefined>
  invitationId: string
  returnTo: string
  returnToField: FieldMetadata<string | undefined>
}

const RegisterHiddenFields = ({
  invitationField,
  invitationId,
  returnTo,
  returnToField,
}: RegisterHiddenFieldsProperties) => (
  <>
    {returnTo && (
      <input {...getInputProps(returnToField, { type: 'hidden' })} key={returnToField.key} />
    )}
    {invitationId && (
      <input {...getInputProps(invitationField, { type: 'hidden' })} key={invitationField.key} />
    )}
  </>
)

type RegisterFieldProperties = {
  autoComplete: string
  field: FieldMetadata<string>
  label: string
  testId: string
  type: 'email' | 'password' | 'text'
}

const RegisterField = ({ autoComplete, field, label, testId, type }: RegisterFieldProperties) => (
  <FormElement htmlFor={field.id} label={label} required>
    <Input
      autoComplete={autoComplete}
      data-testid={testId}
      error={!!field.errors?.length}
      {...getInputProps(field, { type })}
      key={field.key}
    />
    <FormFieldErrors errors={field.errors} />
  </FormElement>
)

const ShowPasswordsButton = ({ isShown, onToggle }: { isShown: boolean; onToggle: () => void }) => {
  const { t } = useTranslation('common')
  return (
    <Button
      className="justify-start gap-2"
      fullWidth
      onClick={(event) => {
        event.preventDefault()
        onToggle()
      }}
      variant="ghost">
      <LucideIcon icon={isShown ? Eye : EyeOff} size={24} />
      <span>
        {isShown
          ? t('ui.hidePasswords', {
              defaultValue: 'Hide passwords',
            })
          : t('ui.showPasswords', {
              defaultValue: 'Show passwords',
            })}
      </span>
    </Button>
  )
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo') ?? '/')
  await redirectIfSignedIn(request, returnTo)

  const email = url.searchParams.get('email') ?? ''
  const invitationId = url.searchParams.get('invitation_id') ?? ''

  return { email, invitationId, returnTo }
}
