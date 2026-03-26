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

import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { href, useLoaderData } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Logo } from '~/components/ui/icons/logo'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { LoginInfoPanel } from '~/features/auth/auth-info-panels'
import { AuthLayout } from '~/features/auth/auth-layout'

import { type Route } from './+types/auth.error'

export default function AuthError() {
  const { error } = useLoaderData<typeof loader>()
  const { t } = useTranslation('common')

  const getErrorDetails = (
    errorCode: null | string,
  ): { message: string; title: string } => {
    if (!errorCode) {
      return {
        message: t('auth.errors.unknown.message', {
          defaultValue: 'An unexpected error occurred during authentication.',
        }),
        title: t('auth.errors.unknown.title', {
          defaultValue: 'Authentication Error',
        }),
      }
    }

    switch (errorCode) {
      case 'AccessDenied': {
        return {
          message: t('auth.errors.accessDenied.message', {
            defaultValue:
              'You do not have permission to sign in. Please contact your administrator.',
          }),
          title: t('auth.errors.accessDenied.title', {
            defaultValue: 'Access Denied',
          }),
        }
      }
      case 'Configuration': {
        return {
          message: t('auth.errors.configuration.message', {
            defaultValue:
              'There is a problem with the server configuration. Please contact your administrator.',
          }),
          title: t('auth.errors.configuration.title', {
            defaultValue: 'Configuration Error',
          }),
        }
      }
      case 'CredentialsSignin': {
        return {
          message: t('auth.errors.credentials.message', {
            defaultValue:
              'The credentials you provided are incorrect. Please try again.',
          }),
          title: t('auth.errors.credentials.title', {
            defaultValue: 'Sign In Failed',
          }),
        }
      }
      case 'EmailCreateAccount':
      case 'EmailSignin': {
        return {
          message: t('auth.errors.email.message', {
            defaultValue:
              'Could not send sign-in email. Please try again later.',
          }),
          title: t('auth.errors.email.title', {
            defaultValue: 'Email Error',
          }),
        }
      }
      case 'OAuthAccountNotLinked':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'OAuthSignin': {
        return {
          message: t('auth.errors.oauth.message', {
            defaultValue:
              'An error occurred during OAuth authentication. Please try again or use a different sign-in method.',
          }),
          title: t('auth.errors.oauth.title', {
            defaultValue: 'OAuth Error',
          }),
        }
      }
      case 'SessionRequired': {
        return {
          message: t('auth.errors.sessionRequired.message', {
            defaultValue: 'Please sign in to continue.',
          }),
          title: t('auth.errors.sessionRequired.title', {
            defaultValue: 'Session Required',
          }),
        }
      }
      case 'Verification': {
        return {
          message: t('auth.errors.verification.message', {
            defaultValue:
              'The verification token has expired or has already been used. Please try signing in again.',
          }),
          title: t('auth.errors.verification.title', {
            defaultValue: 'Verification Failed',
          }),
        }
      }
      default: {
        return {
          message: t('auth.errors.default.message', {
            defaultValue:
              'An error occurred during authentication. Please try again.',
          }),
          title: t('auth.errors.default.title', {
            defaultValue: 'Authentication Error',
          }),
        }
      }
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <AuthLayout infoPanel={<LoginInfoPanel />}>
      <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardBody className="items-center gap-6 p-8 lg:p-10">
          <div className="mb-4 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="text-warning">
            <LucideIcon icon={AlertTriangle} size={64} />
          </div>

          <div className="text-center">
            <h2
              className="mb-2 text-2xl font-bold"
              data-testid="auth-error-title"
            >
              {errorDetails.title}
            </h2>
            <p
              className="text-base-content/70 max-w-md"
              data-testid="auth-error-message"
            >
              {errorDetails.message}
            </p>
          </div>

          {error && (
            <div
              className="bg-base-200 rounded-lg p-3"
              data-testid="auth-error-code"
            >
              <p className="text-base-content/50 text-center text-xs">
                {t('auth.errors.errorCode', {
                  defaultValue: 'Error code',
                })}
                :{' '}
                <code className="text-base-content/70 font-mono">{error}</code>
              </p>
            </div>
          )}

          <div className="mt-4 w-full">
            <a data-testid="auth-error-back-btn" href={href('/login')}>
              <Button
                className="w-full gap-2"
                size="lg"
                type="button"
                variant="primary"
              >
                <LucideIcon icon={ArrowLeft} size={20} />
                {t('auth.errors.backToLogin', {
                  defaultValue: 'Back to Login',
                })}
              </Button>
            </a>
          </div>

          <div className="text-center">
            <p className="text-base-content/50 text-sm">
              {t('auth.errors.persistentIssue', {
                defaultValue:
                  'If this issue persists, please contact your administrator.',
              })}
            </p>
          </div>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error') ?? null

  return { error }
}
