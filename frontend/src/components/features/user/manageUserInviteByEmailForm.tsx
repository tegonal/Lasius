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
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { Select } from 'components/ui/forms/input/Select'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalDescription } from 'components/ui/overlays/modal/ModalDescription'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
import { UserRoles } from 'dynamicTranslationStrings'
import { ModelsUserOrganisationRoleEnum, ModelsUserProjectRoleEnum } from 'lib/api/enums'
import { ModelsInvitationResult } from 'lib/api/lasius'
import { inviteOrganisationUser } from 'lib/api/lasius/organisations/organisations'
import { inviteProjectUser } from 'lib/api/lasius/projects/projects'
import { logger } from 'lib/logger'
import { Copy } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCopyToClipboard } from 'usehooks-ts'
import { z } from 'zod'

import type { TFunction } from 'i18next'

type Props = {
  organisation: string | undefined
  project?: string
  onSave: () => void
  onCancel?: () => void
}

// Schema factory functions for each mode
const createProjectInviteSchema = (t: TFunction) =>
  z.object({
    inviteMemberByEmailAddress: z
      .string()
      .min(1, t('validation.emailRequired', { defaultValue: 'Email is required' }))
      .email(t('validation.emailInvalid', { defaultValue: 'Invalid email address' })),
    projectRole: z.nativeEnum(ModelsUserProjectRoleEnum),
  })

const createOrganisationInviteSchema = (t: TFunction) =>
  z.object({
    inviteMemberByEmailAddress: z
      .string()
      .min(1, t('validation.emailRequired', { defaultValue: 'Email is required' }))
      .email(t('validation.emailInvalid', { defaultValue: 'Invalid email address' })),
    organisationRole: z.nativeEnum(ModelsUserOrganisationRoleEnum),
  })

type ProjectInviteFormData = z.infer<ReturnType<typeof createProjectInviteSchema>>
type OrganisationInviteFormData = z.infer<ReturnType<typeof createOrganisationInviteSchema>>
type FormData = ProjectInviteFormData & OrganisationInviteFormData

export const ManageUserInviteByEmailForm: React.FC<Props> = ({
  onSave,
  onCancel,
  organisation,
  project,
}) => {
  const { t } = useTranslation('common')
  const mode = project && organisation ? 'project' : 'organisation'

  // Memoize schema to prevent recreation on every render
  const schema = useMemo(
    () => (mode === 'project' ? createProjectInviteSchema(t) : createOrganisationInviteSchema(t)),
    [t, mode],
  )

  const hookForm = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    mode: 'onSubmit',
    defaultValues: {
      inviteMemberByEmailAddress: '',
      projectRole: ModelsUserProjectRoleEnum.ProjectMember,
      organisationRole: ModelsUserOrganisationRoleEnum.OrganisationMember,
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [invitationResult, setInvitationResult] = useState<ModelsInvitationResult | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_value, copy] = useCopyToClipboard()

  const handleCloseResult = () => {
    hookForm.reset()
    setShowResult(false)
    onSave()
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    const { inviteMemberByEmailAddress, projectRole, organisationRole } = hookForm.getValues()
    try {
      if (project && organisation) {
        const data = await inviteProjectUser(organisation, project, {
          email: inviteMemberByEmailAddress,
          role: projectRole,
        })
        setInvitationResult(data)
      } else if (organisation) {
        const data = await inviteOrganisationUser(organisation, {
          email: inviteMemberByEmailAddress,
          role: organisationRole,
        })
        setInvitationResult(data)
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
            {t('members.actions.invite', { defaultValue: 'Invite member' })}
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
                {t('invitations.email', { defaultValue: 'Email' })}
              </Label>
              <Input {...hookForm.register('inviteMemberByEmailAddress')} autoComplete="off" />
              <FormErrorBadge error={hookForm.formState.errors.inviteMemberByEmailAddress} />
            </FormElement>
            {mode === 'project' && (
              <FormElement>
                <Label htmlFor="projectRole">
                  {t('projects.projectRole', { defaultValue: 'Project role' })}
                </Label>
                <Select
                  id="projectRole"
                  value={hookForm.watch('projectRole') || ModelsUserProjectRoleEnum.ProjectMember}
                  onChange={(value) =>
                    hookForm.setValue('projectRole', value as ModelsUserProjectRoleEnum, {
                      shouldValidate: true,
                    })
                  }
                  options={[
                    {
                      value: ModelsUserProjectRoleEnum.ProjectMember,
                      label: UserRoles[ModelsUserProjectRoleEnum.ProjectMember],
                    },
                    {
                      value: ModelsUserProjectRoleEnum.ProjectAdministrator,
                      label: UserRoles[ModelsUserProjectRoleEnum.ProjectAdministrator],
                    },
                  ]}
                />
                <FormErrorBadge error={hookForm.formState.errors.projectRole} />
              </FormElement>
            )}
            {mode === 'organisation' && (
              <FormElement>
                <Label htmlFor="organisationRole">
                  {t('organisations.organisationRole', { defaultValue: 'Organisation role' })}
                </Label>
                <Select
                  id="organisationRole"
                  value={
                    hookForm.watch('organisationRole') ||
                    ModelsUserOrganisationRoleEnum.OrganisationMember
                  }
                  onChange={(value) =>
                    hookForm.setValue('organisationRole', value as ModelsUserOrganisationRoleEnum, {
                      shouldValidate: true,
                    })
                  }
                  options={[
                    {
                      value: ModelsUserOrganisationRoleEnum.OrganisationMember,
                      label: UserRoles[ModelsUserOrganisationRoleEnum.OrganisationMember],
                    },
                    {
                      value: ModelsUserOrganisationRoleEnum.OrganisationAdministrator,
                      label: UserRoles[ModelsUserOrganisationRoleEnum.OrganisationAdministrator],
                    },
                  ]}
                />
                <FormErrorBadge error={hookForm.formState.errors.organisationRole} />
              </FormElement>
            )}
          </FieldSet>
          <ButtonGroup>
            <Button type="submit" disabled={isSubmitting}>
              {t('common.actions.invite', { defaultValue: 'Invite' })}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('common.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
            )}
          </ButtonGroup>
        </FormBody>
      </form>

      {showResult && invitationResult && invitationResult.invitationLinkId && (
        <Modal open={showResult} onClose={handleCloseResult} blockViewport>
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
              <code className="bg-base-200 flex-1 rounded px-2 py-1">
                {registrationLink(invitationResult.invitationLinkId)}
              </code>

              <Button
                variant="primary"
                shape="circle"
                fullWidth={false}
                aria-label={t('invitations.copyToClipboard', { defaultValue: 'Copy to clipboard' })}
                onClick={() => copy(registrationLink(invitationResult.invitationLinkId || ''))}>
                <LucideIcon icon={Copy} size={16} />
              </Button>
            </div>

            <ButtonGroup>
              <Button type="button" variant="primary" onClick={handleCloseResult}>
                {t('common.actions.close', { defaultValue: 'Close' })}
              </Button>
            </ButtonGroup>
          </div>
        </Modal>
      )}

      {showResult && invitationResult && !invitationResult.invitationLinkId && (
        <Modal open={showResult} onClose={handleCloseResult} blockViewport>
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
              <code className="bg-base-200 rounded px-2 py-1">{invitationResult.email}</code>
            </div>

            <ButtonGroup>
              <Button type="button" variant="primary" onClick={handleCloseResult}>
                {t('common.actions.close', { defaultValue: 'Close' })}
              </Button>
            </ButtonGroup>
          </div>
        </Modal>
      )}
    </>
  )
}
