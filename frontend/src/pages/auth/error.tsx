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

import { LoginInfoPanel } from 'components/features/login/authInfoPanels'
import { AuthLayout } from 'components/features/login/authLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Logo } from 'components/ui/icons/Logo'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { getServerSidePropsWithoutAuth } from 'lib/auth/getServerSidePropsWithoutAuth'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { GetServerSidePropsContext, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'

const AuthError: NextPage<{ locale?: string; defaultLocale?: string }> = ({
  locale,
  defaultLocale,
}) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { error } = router.query

  // Map NextAuth error codes to user-friendly messages
  const getErrorDetails = (
    errorCode: string | string[] | undefined,
  ): { title: string; message: string } => {
    if (!errorCode) {
      return {
        title: t('auth.errors.unknown.title', { defaultValue: 'Authentication Error' }),
        message: t('auth.errors.unknown.message', {
          defaultValue: 'An unexpected error occurred during authentication.',
        }),
      }
    }

    const code = Array.isArray(errorCode) ? errorCode[0] : errorCode

    switch (code) {
      case 'Configuration':
        return {
          title: t('auth.errors.configuration.title', { defaultValue: 'Configuration Error' }),
          message: t('auth.errors.configuration.message', {
            defaultValue:
              'There is a problem with the server configuration. Please contact your administrator.',
          }),
        }
      case 'AccessDenied':
        return {
          title: t('auth.errors.accessDenied.title', { defaultValue: 'Access Denied' }),
          message: t('auth.errors.accessDenied.message', {
            defaultValue:
              'You do not have permission to sign in. Please contact your administrator.',
          }),
        }
      case 'Verification':
        return {
          title: t('auth.errors.verification.title', { defaultValue: 'Verification Failed' }),
          message: t('auth.errors.verification.message', {
            defaultValue:
              'The verification token has expired or has already been used. Please try signing in again.',
          }),
        }
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'OAuthAccountNotLinked':
        return {
          title: t('auth.errors.oauth.title', { defaultValue: 'OAuth Error' }),
          message: t('auth.errors.oauth.message', {
            defaultValue:
              'An error occurred during OAuth authentication. Please try again or use a different sign-in method.',
          }),
        }
      case 'EmailCreateAccount':
      case 'EmailSignin':
        return {
          title: t('auth.errors.email.title', { defaultValue: 'Email Error' }),
          message: t('auth.errors.email.message', {
            defaultValue: 'Could not send sign-in email. Please try again later.',
          }),
        }
      case 'CredentialsSignin':
        return {
          title: t('auth.errors.credentials.title', { defaultValue: 'Sign In Failed' }),
          message: t('auth.errors.credentials.message', {
            defaultValue: 'The credentials you provided are incorrect. Please try again.',
          }),
        }
      case 'SessionRequired':
        return {
          title: t('auth.errors.sessionRequired.title', { defaultValue: 'Session Required' }),
          message: t('auth.errors.sessionRequired.message', {
            defaultValue: 'Please sign in to continue.',
          }),
        }
      case 'Default':
      default:
        return {
          title: t('auth.errors.default.title', { defaultValue: 'Authentication Error' }),
          message: t('auth.errors.default.message', {
            defaultValue: 'An error occurred during authentication. Please try again.',
          }),
        }
    }
  }

  const errorDetails = getErrorDetails(error)

  const handleBackToLogin = () => {
    router.push('/login')
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lasius.io'
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent('Authentication Error')}&subtitle=${encodeURIComponent('Lasius')}`

  return (
    <>
      <NextSeo
        title="Authentication Error - Lasius"
        description="An error occurred during authentication. Please try again."
        canonical={`${baseUrl}/auth/error`}
        openGraph={{
          url: `${baseUrl}/auth/error`,
          title: 'Authentication Error - Lasius',
          description: 'An error occurred during authentication. Please try again.',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: 'Lasius - Authentication Error',
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
        <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
          <CardBody className="items-center gap-6 p-8 lg:p-10">
            {/* Logo for mobile */}
            <div className="mb-4 flex justify-center lg:hidden">
              <Logo />
            </div>

            {/* Error icon */}
            <div className="text-warning">
              <LucideIcon icon={AlertTriangle} size={64} />
            </div>

            {/* Error title */}
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">{errorDetails.title}</h2>
              <p className="text-base-content/70 max-w-md">{errorDetails.message}</p>
            </div>

            {/* Technical details (optional, shown in smaller text) */}
            {error && (
              <div className="bg-base-200 rounded-lg p-3">
                <p className="text-base-content/50 text-center text-xs">
                  {t('auth.errors.errorCode', { defaultValue: 'Error code' })}:{' '}
                  <code className="text-base-content/70 font-mono">{error}</code>
                </p>
              </div>
            )}

            {/* Back to login button */}
            <div className="mt-4 w-full">
              <Button
                onClick={handleBackToLogin}
                variant="primary"
                size="lg"
                className="w-full gap-2">
                <LucideIcon icon={ArrowLeft} size={20} />
                {t('auth.errors.backToLogin', { defaultValue: 'Back to Login' })}
              </Button>
            </div>

            {/* Help text */}
            <div className="text-center">
              <p className="text-base-content/50 text-sm">
                {t('auth.errors.persistentIssue', {
                  defaultValue: 'If this issue persists, please contact your administrator.',
                })}
              </p>
            </div>
          </CardBody>
        </Card>
      </AuthLayout>
    </>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return getServerSidePropsWithoutAuth(context, async () => {
    return {}
  })
}

export default AuthError
