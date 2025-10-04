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

import { AxiosError } from 'axios'
import { RegisterInfoPanel } from 'components/features/login/authInfoPanels'
import { AuthLayout } from 'components/features/login/authLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { FormErrorsMultiple } from 'components/ui/forms/formErrorsMultiple'
import { Logo } from 'components/ui/icons/Logo'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { registerOAuthUser } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { getServerSidePropsWithoutAuth } from 'lib/auth/getServerSidePropsWithoutAuth'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { Eye, EyeOff } from 'lucide-react'
import { GetServerSideProps, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

export const OAuthUserRegister: NextPage<{ locale?: string }> = ({ locale }) => {
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation('common')
  const router = useRouter()
  const { invitation_id = undefined, email = undefined } = router.query
  const plausible = usePlausible<LasiusPlausibleEvents>()

  // list of known error response codes, used tp provide translations only
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const translations = [
    t('auth.errors.registerUnknown', { defaultValue: 'Unknown registration error' }),
    t('auth.errors.userAlreadyRegistered', { defaultValue: 'User already registered' }),
  ]

  const {
    register,
    handleSubmit,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm({
    mode: 'onSubmit',
    criteriaMode: 'all',
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      email: email?.toString() || '',
    },
  })

  useEffect(() => {
    if (email) {
      setFocus('firstName')
    } else {
      setFocus('email')
    }
  }, [setFocus, email])

  const onSubmit = async () => {
    const data = getValues()

    plausible('invitation', {
      props: {
        status: 'registered',
      },
    })

    try {
      const response = await registerOAuthUser({
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.confirmPassword,
        email: data.email,
      })

      if (response) {
        const url =
          '/login?' +
          new URLSearchParams({
            invitation_id: invitation_id?.toString() || '',
            email: data.email?.toString() || '',
            locale: locale || '',
          })
        await router.replace(url)
      } else {
        setError('registerUserFailedUnknown')
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data || 'unknown_error')
      } else {
        setError('unknown_error')
      }
    }
  }

  const handleTogglePasswordsVisible = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setShowPasswords(!showPasswords)
  }

  return (
    <AuthLayout infoPanel={<RegisterInfoPanel />}>
      {error && (
        <Alert variant="warning" className="animate-[fadeIn_0.4s_ease-out]">
          {error === 'user_already_registered'
            ? t('auth.errors.userAlreadyRegistered', { defaultValue: 'User already registered' })
            : t('auth.errors.registerUnknown', { defaultValue: 'Unknown registration error' })}
        </Alert>
      )}
      {invitation_id && (
        <Alert variant="info" className="animate-[fadeIn_0.4s_ease-out]">
          {t('invitations.createAccountMessage', {
            defaultValue:
              'You have been invited to create an account so that you can use Lasius to track your working hours.',
          })}
        </Alert>
      )}
      <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardBody className="p-8 lg:p-10">
          <div className="mb-4 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">
              {t('auth.createYourAccount', { defaultValue: 'Create your account' })}
            </h2>
            <p className="text-base-content/60 text-sm">
              {t('auth.fillDetailsToStart', {
                defaultValue: 'Please fill in your details to get started',
              })}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormBody>
              <FieldSet>
                <FormElement
                  label={t('common.forms.email', { defaultValue: 'Email' })}
                  htmlFor="email"
                  required>
                  <Input
                    id="email"
                    {...register('email', { required: true })}
                    aria-describedby="email-error"
                    autoComplete="email"
                    autoFocus
                  />
                  <FormErrorBadge id="email-error" error={errors.email} />
                </FormElement>
                <FormElement
                  label={t('common.forms.firstName', { defaultValue: 'First name' })}
                  htmlFor="firstName"
                  required>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: true })}
                    aria-describedby="firstName-error"
                    autoComplete="given-name"
                  />
                  <FormErrorBadge id="firstName-error" error={errors.firstName} />
                </FormElement>
                <FormElement
                  label={t('common.forms.lastName', { defaultValue: 'Last name' })}
                  htmlFor="lastName"
                  required>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: true })}
                    aria-describedby="lastName-error"
                    autoComplete="family-name"
                  />
                  <FormErrorBadge id="lastName-error" error={errors.lastName} />
                </FormElement>
                <FormElement
                  label={t('common.forms.password', { defaultValue: 'Password' })}
                  htmlFor="password"
                  required>
                  <Input
                    id="password"
                    {...register('password', {
                      required: true,
                      validate: {
                        notEnoughCharactersPassword: (value: string) => value.length > 8,
                        noUppercase: (value: string) => /(?=.*[A-Z])/.test(value),
                        noNumber: (value: string) => /\d/.test(value),
                      },
                    })}
                    aria-describedby="password-errors"
                    autoComplete="new-password"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorsMultiple id="password-errors" errors={errors.password as any} />
                </FormElement>
                <FormElement
                  label={t('common.forms.confirmPassword', { defaultValue: 'Confirm password' })}
                  htmlFor="confirmPassword"
                  required>
                  <Input
                    id="confirmPassword"
                    {...register('confirmPassword', {
                      required: true,
                      validate: {
                        noPasswordConfirmNewEqual: (value: string) =>
                          value === getValues('password'),
                      },
                    })}
                    aria-describedby="confirmPassword-error"
                    autoComplete="new-password"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorBadge id="confirmPassword-error" error={errors.confirmPassword} />
                </FormElement>
              </FieldSet>
              <ButtonGroup>
                <Button
                  onClick={handleTogglePasswordsVisible}
                  variant="ghost"
                  fullWidth
                  className="justify-start gap-2">
                  <LucideIcon icon={showPasswords ? Eye : EyeOff} size={24} />
                  <span>
                    {showPasswords
                      ? t('ui.hidePasswords', { defaultValue: 'Hide passwords' })
                      : t('ui.showPasswords', { defaultValue: 'Show passwords' })}
                  </span>
                </Button>
                <Button type="submit" fullWidth>
                  {t('common.actions.signUp', { defaultValue: 'Sign up' })}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithoutAuth(context)
}

export default OAuthUserRegister
