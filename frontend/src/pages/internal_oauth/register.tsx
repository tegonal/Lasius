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
import { LoginLayout } from 'components/features/login/loginLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { FormBody } from 'components/ui/forms/formBody'
import { FormButtonContainer } from 'components/ui/forms/formButtonContainer'
import { FormElement } from 'components/ui/forms/formElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { FormErrorsMultiple } from 'components/ui/forms/formErrorsMultiple'
import { Icon } from 'components/ui/icons/Icon'
import { Logo } from 'components/ui/icons/Logo'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { registerOAuthUser } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { GetServerSideProps, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
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
    <LoginLayout>
      {error && (
        <Alert variant="warning" className="max-w-md">
          {error === 'user_already_registered'
            ? t('auth.errors.userAlreadyRegistered', { defaultValue: 'User already registered' })
            : t('auth.errors.registerUnknown', { defaultValue: 'Unknown registration error' })}
        </Alert>
      )}
      {invitation_id && (
        <Alert variant="info" className="max-w-md">
          {t('invitations.createAccountMessage', {
            defaultValue:
              'You have been invited to create an account so that you can use Lasius to track your working hours.',
          })}
        </Alert>
      )}
      <Card shadow="lg" className="w-full max-w-md">
        <CardBody className="gap-6 p-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="h-4" />
          <div className="space-y-3 text-center">
            <p className="text-xl font-semibold">
              {t('auth.createYourAccount', { defaultValue: 'Create your account' })}
            </p>
            <p className="text-base-content/70 text-sm">
              {t('auth.fillDetailsToStart', {
                defaultValue: 'Please fill in your details to get started',
              })}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormBody>
              <FormElement>
                <Label htmlFor="email">{t('common.forms.email', { defaultValue: 'E-Mail' })}</Label>
                <Input {...register('email', { required: true })} autoComplete="off" autoFocus />
                <FormErrorBadge error={errors.email} />
              </FormElement>
              <FormElement>
                <Label htmlFor="firstName">
                  {t('common.forms.firstName', { defaultValue: 'Firstname' })}
                </Label>
                <Input
                  {...register('firstName', { required: true })}
                  autoComplete="off"
                  autoFocus
                />
                <FormErrorBadge error={errors.firstName} />
              </FormElement>
              <FormElement>
                <Label htmlFor="lastName">
                  {t('common.forms.lastName', { defaultValue: 'Lastname' })}
                </Label>
                <Input {...register('lastName', { required: true })} autoComplete="off" autoFocus />
                <FormErrorBadge error={errors.lastName} />
              </FormElement>
              <FormElement>
                <Label htmlFor="password">
                  {t('common.forms.password', { defaultValue: 'Password' })}
                </Label>
                <Input
                  {...register('password', {
                    required: true,
                    validate: {
                      notEnoughCharactersPassword: (value: string) => value.length > 8,
                      noUppercase: (value: string) => /(?=.*[A-Z])/.test(value),
                      noNumber: (value: string) => /\d/.test(value),
                    },
                  })}
                  autoComplete="off"
                  autoFocus
                  type={showPasswords ? 'text' : 'password'}
                />
                <FormErrorsMultiple errors={errors.password as any} />
              </FormElement>
              <FormElement>
                <Label htmlFor="confirmPassword">
                  {t('common.forms.confirmPassword', { defaultValue: 'Confirm password' })}
                </Label>
                <Input
                  {...register('confirmPassword', {
                    required: true,
                    validate: {
                      noPasswordConfirmNewEqual: (value: string) => value === getValues('password'),
                    },
                  })}
                  autoComplete="off"
                  autoFocus
                  type={showPasswords ? 'text' : 'password'}
                />
                <FormErrorBadge error={errors.confirmPassword} />
              </FormElement>
              <FormButtonContainer>
                <Button
                  onClick={handleTogglePasswordsVisible}
                  variant="ghost"
                  fullWidth
                  className="justify-start gap-2">
                  <Icon
                    name={
                      showPasswords ? 'view-1-interface-essential' : 'view-off-interface-essential'
                    }
                    size={24}
                  />
                  <span>
                    {showPasswords
                      ? t('ui.hidePasswords', { defaultValue: 'Hide passwords' })
                      : t('ui.showPasswords', { defaultValue: 'Show passwords' })}
                  </span>
                </Button>
                <Button type="submit" fullWidth>
                  {t('common.actions.signUp', { defaultValue: 'Sign up' })}
                </Button>
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
  return {
    props: {
      ...(await serverSideTranslations(resolvedLocale || '', ['common'])),
      locale: resolvedLocale,
    },
  }
}

export default OAuthUserRegister
