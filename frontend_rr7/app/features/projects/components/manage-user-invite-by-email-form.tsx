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

import { zodResolver } from '@hookform/resolvers/zod'
import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { Select } from '~/components/ui/forms/input/select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { UserRoles } from '~/config/dynamic-translation-strings'
import { logger } from '~/lib/logger'
import { type ModelsInvitationResult } from '~/services/api/lasius/modelsInvitationResult'
import { type ModelsUserToOrganisationAssignmentRole } from '~/services/api/lasius/modelsUserToOrganisationAssignmentRole'
import { type ModelsUserToProjectAssignmentRole } from '~/services/api/lasius/modelsUserToProjectAssignmentRole'
import { inviteOrganisationUser } from '~/services/api/lasius/organisations/organisations'
import { inviteProjectUser } from '~/services/api/lasius/projects/projects'

type FormData = {
	inviteMemberByEmailAddress: string
	organisationRole: ModelsUserToOrganisationAssignmentRole
	projectRole: ModelsUserToProjectAssignmentRole
}

type Props = {
	onCancel?: () => void
	onSave: () => void
	organisation: string
	project?: string
}

export const ManageUserInviteByEmailForm = ({
	onCancel,
	onSave,
	organisation,
	project,
}: Props) => {
	const { t } = useTranslation('common')
	const mode = project ? 'project' : 'organisation'

	const schema = useMemo(
		() =>
			z.object({
				inviteMemberByEmailAddress: z.string().email(
					t('common.validation.email', {
						defaultValue: 'Please enter a valid email address',
					}),
				),
				organisationRole: z.string(),
				projectRole: z.string(),
			}),
		[t],
	)

	const hookForm = useForm<FormData>({
		defaultValues: {
			inviteMemberByEmailAddress: '',
			organisationRole: 'OrganisationMember',
			projectRole: 'ProjectMember',
		},
		mode: 'onSubmit',
		resolver: zodResolver(schema) as never,
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showResult, setShowResult] = useState(false)
	const [invitationResult, setInvitationResult] =
		useState<ModelsInvitationResult | null>(null)

	const handleCloseResult = () => {
		hookForm.reset()
		setShowResult(false)
		onSave()
	}

	const onSubmit = async () => {
		setIsSubmitting(true)
		const { inviteMemberByEmailAddress, organisationRole, projectRole } =
			hookForm.getValues()
		try {
			if (project && organisation) {
				const data = await inviteProjectUser(organisation, project, {
					email: inviteMemberByEmailAddress,
					role: projectRole,
				})
				setInvitationResult(data.data)
			} else if (organisation) {
				const data = await inviteOrganisationUser(organisation, {
					email: inviteMemberByEmailAddress,
					role: organisationRole,
				})
				setInvitationResult(data.data)
			}
			setIsSubmitting(false)
			setShowResult(true)
		} catch (error) {
			logger.error('[ManageUserInviteByEmailForm] Invitation error:', error)
			setIsSubmitting(false)
		}
	}

	const registrationLink = (invitationId: string) => {
		const url = new URL(window.location.toString())
		return `${url.protocol}//${url.host}/join/${invitationId}`
	}

	const handleCopy = (text: string) => {
		void navigator.clipboard.writeText(text)
	}

	const handleClose = () => {
		if (onCancel) {
			onCancel()
		}
	}

	return (
		<>
			<form onSubmit={hookForm.handleSubmit(onSubmit)}>
				<FormBody>
					<ModalCloseButton onClose={handleClose} />

					<ModalHeader className="mb-2">
						{t('members.actions.invite', {
							defaultValue: 'Invite someone',
						})}
					</ModalHeader>

					<ModalDescription className="mb-4">
						{mode === 'project'
							? t('invitations.inviteProjectDescription', {
									defaultValue:
										'Enter the email address of the person you want to invite. An invitation link will be generated that you can send to them.',
								})
							: t('invitations.inviteOrganisationDescription', {
									defaultValue:
										'Enter the email address of the person you want to invite. An invitation link will be generated that you can send to them.',
								})}
					</ModalDescription>

					<FieldSet>
						<FormElement>
							<Label htmlFor="inviteMemberByEmailAddress">
								{t('invitations.email', {
									defaultValue: 'Email',
								})}
							</Label>
							<Input
								data-testid="org-invite-email-input"
								{...hookForm.register('inviteMemberByEmailAddress')}
								autoComplete="off"
							/>
							<FormErrorBadge
								error={hookForm.formState.errors.inviteMemberByEmailAddress}
							/>
						</FormElement>
						{mode === 'project' && (
							<FormElement>
								<Label htmlFor="projectRole">
									{t('projects.projectRole', {
										defaultValue: 'Project role',
									})}
								</Label>
								<Select
									id="projectRole"
									onChange={(value) =>
										hookForm.setValue(
											'projectRole',
											value as ModelsUserToProjectAssignmentRole,
											{
												shouldValidate: true,
											},
										)
									}
									options={[
										{
											label: UserRoles.ProjectMember || 'Member',
											value: 'ProjectMember',
										},
										{
											label: UserRoles.ProjectAdministrator || 'Administrator',
											value: 'ProjectAdministrator',
										},
									]}
									value={hookForm.watch('projectRole') || 'ProjectMember'}
								/>
							</FormElement>
						)}
						{mode === 'organisation' && (
							<FormElement>
								<Label htmlFor="organisationRole">
									{t('organisations.organisationRole', {
										defaultValue: 'Organisation role',
									})}
								</Label>
								<Select
									id="organisationRole"
									onChange={(value) =>
										hookForm.setValue(
											'organisationRole',
											value as ModelsUserToOrganisationAssignmentRole,
											{
												shouldValidate: true,
											},
										)
									}
									options={[
										{
											label: UserRoles.OrganisationMember || 'Member',
											value: 'OrganisationMember',
										},
										{
											label:
												UserRoles.OrganisationAdministrator || 'Administrator',
											value: 'OrganisationAdministrator',
										},
									]}
									value={
										hookForm.watch('organisationRole') || 'OrganisationMember'
									}
								/>
							</FormElement>
						)}
					</FieldSet>

					<ButtonGroup>
						<Button disabled={isSubmitting} type="submit" variant="primary">
							{t('members.actions.invite', {
								defaultValue: 'Invite someone',
							})}
						</Button>
						<Button onClick={handleClose} type="button" variant="secondary">
							{t('common.actions.cancel', {
								defaultValue: 'Cancel',
							})}
						</Button>
					</ButtonGroup>
				</FormBody>
			</form>

			{showResult && invitationResult && invitationResult.invitationLinkId && (
				<Modal blockViewport onClose={handleCloseResult} open={showResult}>
					<div className="flex flex-col gap-4">
						<ModalCloseButton onClose={handleCloseResult} />

						<ModalHeader>
							{t('invitations.title.invitationCreated', {
								defaultValue: 'Invitation created',
							})}
						</ModalHeader>

						<ModalDescription>
							{t('invitations.description.copyLink', {
								defaultValue:
									'Copy the link and send it to your colleague. If they do not have an account yet, one will be created when the invitation is accepted.',
							})}
						</ModalDescription>

						<div className="flex gap-3">
							<code
								className="bg-base-200 flex-1 rounded px-2 py-1"
								data-testid="org-invite-link"
							>
								{registrationLink(invitationResult.invitationLinkId)}
							</code>

							<Button
								aria-label={t('invitations.copyToClipboard', {
									defaultValue: 'Copy to clipboard',
								})}
								data-testid="org-invite-copy-btn"
								fullWidth={false}
								onClick={() =>
									handleCopy(
										registrationLink(invitationResult.invitationLinkId || ''),
									)
								}
								shape="circle"
								variant="primary"
							>
								<LucideIcon icon={Copy} size={16} />
							</Button>
						</div>

						<ButtonGroup>
							<Button
								data-testid="org-invite-close-btn"
								onClick={handleCloseResult}
								type="button"
								variant="primary"
							>
								{t('common.actions.close', {
									defaultValue: 'Close',
								})}
							</Button>
						</ButtonGroup>
					</div>
				</Modal>
			)}

			{showResult && invitationResult && !invitationResult.invitationLinkId && (
				<Modal blockViewport onClose={handleCloseResult} open={showResult}>
					<div className="flex flex-col gap-4">
						<ModalCloseButton onClose={handleCloseResult} />

						<ModalHeader>
							{t('invitations.title.userAssigned', {
								defaultValue: 'User assigned',
							})}
						</ModalHeader>

						<ModalDescription>
							{t('projects.status.assignedToUser', {
								defaultValue: 'Project successfully assigned to user.',
							})}
						</ModalDescription>

						<div className="flex gap-3">
							<code className="bg-base-200 rounded px-2 py-1">
								{invitationResult.email}
							</code>
						</div>

						<ButtonGroup>
							<Button
								data-testid="org-invite-assigned-close-btn"
								onClick={handleCloseResult}
								type="button"
								variant="primary"
							>
								{t('common.actions.close', {
									defaultValue: 'Close',
								})}
							</Button>
						</ButtonGroup>
					</div>
				</Modal>
			)}
		</>
	)
}
