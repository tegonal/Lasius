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
import { useTranslation } from 'react-i18next'
import { href } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { LasiusIcon } from '~/components/ui/icons/lasius-icon'
import { LoginInfoPanel } from '~/features/auth/auth-info-panels'
import { AuthLayout } from '~/features/auth/auth-layout'
import { type ModelsInvitationStatusResponse } from '~/services/api/lasius/modelsInvitationStatusResponse'
import { type AuthProvider } from '~/services/auth/types'

interface Props {
  invitation: ModelsInvitationStatusResponse
  keycloakName?: string
  providers: AuthProvider[]
}

export const InvitationNeedsAccount = ({
  invitation,
  keycloakName,
  providers = [],
}: Props) => {
  const { t } = useTranslation('invitation')

  const returnTo = `/join/${invitation.invitation.id}`

  const getProviderLoginUrl = (provider: AuthProvider): string => {
    const params = new URLSearchParams({
      invitation_id: invitation.invitation.id,
      returnTo,
    })
    if (provider === 'internal') {
      params.set('email', invitation.invitation.invitedEmail)
      return `${href('/internal-oauth/login')}?${params.toString()}`
    }
    return `${href('/oauth/:provider/login', { provider })}?${params.toString()}`
  }

  const invitationMessage =
    invitation.invitation.type === 'JoinOrganisationInvitation'
      ? t('messages.invitedToOrganisationNeedsAccount', {
          defaultValue:
            'You have been invited by {{inviter}} to join organisation {{organisation}}.',
          inviter: invitation.invitation.createdBy.key,
          organisation: invitation.invitation.organisationReference.key,
        })
      : t('messages.invitedToProjectNeedsAccount', {
          defaultValue:
            'You have been invited by {{inviter}} to join project {{project}}.',
          inviter: invitation.invitation.createdBy.key,
          project: invitation.invitation.projectReference.key,
        })

  return (
    <AuthLayout infoPanel={<LoginInfoPanel />}>
      <Alert variant="info">{invitationMessage}</Alert>

      <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardBody className="p-8 lg:p-10">
          <div className="mb-8 space-y-4 text-center">
            <h2 className="text-3xl font-bold">
              {t('needsAccount.title', 'Account Required')}
            </h2>
            <p className="text-base-content/60">
              {t('needsAccount.description', {
                defaultValue:
                  "You'll need to sign in or create an account for {{email}} to accept this invitation.",
                email: invitation.invitation.invitedEmail,
              })}
            </p>
          </div>

          <Alert variant="warning">
            {t('needsAccount.emailMatch', {
              defaultValue:
                'Make sure to sign in with the email address this invitation was sent to: {{email}}',
              email: invitation.invitation.invitedEmail,
            })}
          </Alert>

          <div className="mt-6 flex flex-col gap-3">
            {providers.map((provider) => (
              <a
                data-testid={`invite-provider-${provider}`}
                href={getProviderLoginUrl(provider)}
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
                    {t(
                      'needsAccount.signInOrSignUpWith',
                      'Sign in or sign up with',
                    )}{' '}
                    <span className="font-semibold">
                      {getProviderDisplayName(provider, keycloakName)}
                    </span>
                  </span>
                </Button>
              </a>
            ))}
          </div>
        </CardBody>
      </Card>
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
