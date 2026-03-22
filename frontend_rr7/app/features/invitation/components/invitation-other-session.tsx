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

import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { Logo } from '~/components/ui/icons/logo'
import { AuthLayout } from '~/features/auth/auth-layout'
import { type ModelsInvitationStatusResponse } from '~/services/api/lasius/modelsInvitationStatusResponse'

interface Props {
	invitation: ModelsInvitationStatusResponse
}

export const InvitationOtherSession = ({ invitation }: Props) => {
	const { t } = useTranslation('common')
	const navigate = useNavigate()

	const handleSignOut = () => {
		void navigate('/logout')
	}

	return (
		<AuthLayout>
			<Card
				className="border-base-300 bg-base-100 w-full max-w-md border"
				data-testid="invite-other-session"
				shadow="xl"
			>
				<CardBody className="gap-6 p-8">
					<div className="flex justify-center">
						<Logo />
					</div>
					<div className="h-4" />
					<Alert variant="warning">
						{t('invitations.errors.createdForSomeoneElse', {
							defaultValue:
								'This invitation has been created for someone else. Either log out and refresh, or forward the invitation link to the user {{email}}',
							email: invitation.invitation.invitedEmail,
						})}
					</Alert>
					<FormBody>
						<FormElement>
							<Button fullWidth onClick={handleSignOut}>
								{t('auth.actions.signOutAndRefresh', {
									defaultValue: 'Sign out and refresh',
								})}
							</Button>
						</FormElement>
					</FormBody>
				</CardBody>
			</Card>
		</AuthLayout>
	)
}
