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

import { SiGithub, SiGitlab, SiKeycloak } from '@icons-pack/react-simple-icons'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { href, redirect, useLoaderData } from 'react-router'

import {
	LoadingInfoPanel,
	LoginInfoPanel,
} from '~/components/features/login/auth-info-panels'
import { AuthLayout } from '~/components/features/login/auth-layout'
import { Button } from '~/components/primitives/buttons/button'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { LasiusIcon } from '~/components/ui/icons/lasius-icon'
import { Logo } from '~/components/ui/icons/logo'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { HelpButton } from '~/features/help/components/help-button'
import { getServerEnv } from '~/lib/env.server'
import {
	getOptionalUser,
	sanitizeReturnTo,
} from '~/services/auth/auth-helpers.server'
import { getEnabledProviders } from '~/services/auth/providers'
import { type AuthProvider } from '~/services/auth/types'

import { type Route } from './+types/login'

export async function loader({ request }: Route.LoaderArgs) {
	const user = await getOptionalUser(request)
	const url = new URL(request.url)
	const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo') ?? '/')
	const error = url.searchParams.get('error') ?? null

	if (user) {
		throw redirect(returnTo)
	}

	const providers = getEnabledProviders()
	const demoMode = getServerEnv('LASIUS_DEMO_MODE') === 'true'
	const keycloakName = getServerEnv('KEYCLOAK_OAUTH_PROVIDER_NAME')

	return { demoMode, error, keycloakName, providers, returnTo }
}

export default function Login() {
	const { demoMode, error, keycloakName, providers, returnTo } =
		useLoaderData<typeof loader>()
	const { t } = useTranslation('common')

	const getErrorMessage = (errorCode: string): string => {
		switch (errorCode) {
			case 'Callback':
				return t('auth.errors.callback', {
					defaultValue: 'Authentication callback failed. Please try again.',
				})
			case 'fetchProfileFailed':
				return t('auth.errors.fetchProfileFailed', {
					defaultValue:
						"Couldn't load user profile. Please try logging in again.",
				})
			case 'no_code':
			case 'OAuthCallback':
			case 'OAuthCallbackError':
				return t('auth.errors.oauthCallback', {
					defaultValue: 'Authentication failed. Please try again.',
				})
			case 'SessionRequired':
				return t('auth.errors.sessionRequired.message', {
					defaultValue: 'Please sign in to continue.',
				})
			case 'state_mismatch':
				return t('auth.errors.stateMismatch', {
					defaultValue:
						'Authentication failed: invalid state. Please try again.',
				})
			default:
				return t('auth.errors.general', {
					defaultValue: 'Authentication error. Please try again.',
					error: errorCode,
				})
		}
	}

	// Single provider: show loading state and auto-redirect
	const singleProvider = providers.length === 1 ? providers[0] : undefined
	if (singleProvider && !error) {
		return (
			<AuthLayout infoPanel={<LoadingInfoPanel />}>
				<Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
					<CardBody className="items-center gap-4 p-8">
						<div className="mb-4 flex justify-center lg:hidden">
							<Logo />
						</div>
						<div className="loading loading-spinner loading-lg text-primary"></div>
						<p className="text-base-content/70 text-center">
							{t('auth.preparingSecureLogin', {
								defaultValue: 'Preparing secure login...',
							})}
						</p>
						<meta
							content={`0;url=${getProviderLoginUrl(singleProvider, returnTo)}`}
							httpEquiv="refresh"
						/>
					</CardBody>
				</Card>
			</AuthLayout>
		)
	}

	return (
		<AuthLayout infoPanel={<LoginInfoPanel />}>
			{/* Error Alert */}
			{error && (
				<Alert data-testid="auth-login-error" variant="warning">
					{getErrorMessage(error)}
				</Alert>
			)}

			{/* No providers warning */}
			{providers.length === 0 && (
				<Card className="border-warning bg-warning/5 backdrop-blur-sm">
					<CardBody className="items-center gap-4">
						<div className="flex justify-center lg:hidden">
							<Logo />
						</div>
						<div className="text-warning">
							<LucideIcon icon={AlertTriangle} size={48} />
						</div>
						<p className="text-center font-medium">
							{t('auth.noAuthMethodsAvailable', {
								defaultValue: 'No authentication methods available',
							})}
						</p>
						<p className="text-base-content/70 text-center text-sm">
							{t('common.help.contactAdmin', {
								defaultValue: 'Please contact your administrator',
							})}
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
								{t('auth.signInTitle', {
									defaultValue: 'Sign in to your account',
								})}
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
						<div className="flex flex-col gap-3">
							{providers.map((provider) => (
								<a
									data-testid={`auth-provider-${provider}`}
									href={getProviderLoginUrl(provider, returnTo)}
									key={provider}
								>
									<Button
										className="w-full justify-start gap-3 transition-colors duration-200"
										size="lg"
										type="button"
										variant="secondary"
									>
										<span className="flex h-6 w-6 items-center justify-center">
											{getProviderIcon(provider)}
										</span>
										<span className="flex-1 text-left">
											{t('auth.continueWith', {
												defaultValue: 'Continue with',
											})}{' '}
											<span className="font-semibold">
												{getProviderDisplayName(provider, keycloakName)}
											</span>
										</span>
									</Button>
								</a>
							))}
						</div>

						{/* Demo mode info */}
						{demoMode && (
							<div className="mt-6">
								<Alert variant="info">
									<div>
										<p className="font-semibold">
											{t('demo.title', {
												defaultValue: 'Demo Mode',
											})}
										</p>
										<p className="text-sm">
											{t('demo.credentials', {
												defaultValue:
													'Use "demo1@lasius.ch" and password "demo" to log in and have a look around.',
											})}
										</p>
									</div>
								</Alert>
							</div>
						)}
					</CardBody>
				</Card>
			)}

			{/* Help */}
			<div className="mt-6 flex flex-col items-center gap-2">
				<HelpButton />
				<p className="text-base-content/50 text-center text-sm">
					{t('auth.needHelp', {
						defaultValue: 'Need help? Click the help button',
					})}
				</p>
			</div>
		</AuthLayout>
	)
}

const getProviderDisplayName = (
	provider: AuthProvider,
	keycloakName: string | undefined,
): string => {
	if (provider === 'keycloak' && keycloakName) {
		return keycloakName
	}
	const names: Record<AuthProvider, string> = {
		github: 'GitHub',
		gitlab: 'GitLab',
		internal: 'Email & Password',
		keycloak: 'Keycloak',
	}
	return names[provider]
}

const getProviderIcon = (provider: AuthProvider): React.ReactNode => {
	switch (provider) {
		case 'github':
			return <SiGithub size={24} />
		case 'gitlab':
			return <SiGitlab size={24} />
		case 'internal':
			return <LasiusIcon size={24} />
		case 'keycloak':
			return <SiKeycloak size={24} />
		default:
			return null
	}
}

const getProviderLoginUrl = (
	provider: AuthProvider,
	returnTo: string,
): string => {
	if (provider === 'internal') {
		return `${href('/internal-oauth/login')}?returnTo=${encodeURIComponent(returnTo)}`
	}
	return `${href('/oauth/:provider/login', { provider })}?returnTo=${encodeURIComponent(returnTo)}`
}
