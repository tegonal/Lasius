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
import { ModalConfirm } from 'components/ui/overlays/modal/modalConfirm'
import { UserRoles } from 'dynamicTranslationStrings'
import { ModelsUserOrganisationRoleEnum, ModelsUserProjectRoleEnum } from 'lib/api/enums'
import { ModelsInvitationResult } from 'lib/api/lasius'
import { inviteOrganisationUser } from 'lib/api/lasius/organisations/organisations'
import { inviteProjectUser } from 'lib/api/lasius/projects/projects'
import { emailValidationPattern } from 'lib/utils/data/validators'
import { Copy } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCopyToClipboard } from 'usehooks-ts'

type Props = {
  organisation: string | undefined
  project?: string
  onSave: () => void
  onCancel?: () => void
}

type Form = {
  inviteMemberByEmailAddress: string
  projectRole: ModelsUserProjectRoleEnum
  organisationRole: ModelsUserOrganisationRoleEnum
}

export const ManageUserInviteByEmailForm: React.FC<Props> = ({
  onSave,
  onCancel,
  organisation,
  project,
}) => {
  const { t } = useTranslation('common')
  const mode = project && organisation ? 'project' : 'organisation'
  const hookForm = useForm<Form>({
    mode: 'onChange',
    shouldUnregister: true,
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
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    const { inviteMemberByEmailAddress, projectRole, organisationRole } = hookForm.getValues()
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
    onSave()
  }

  const registrationLink = (invitationId: string) => {
    const url = new URL(window.location.toString())
    return `${url.protocol}//${url.host}/join/${invitationId}`
  }

  return (
    <form onSubmit={hookForm.handleSubmit(onSubmit)}>
      <FormBody>
        <FieldSet>
          <FormElement>
            <Label htmlFor="inviteMemberByEmailAddress">
              {t('invitations.inviteByEmail', { defaultValue: 'Invite by E-Mail' })}
            </Label>
            <Input
              {...hookForm.register('inviteMemberByEmailAddress', {
                required: true,
                pattern: emailValidationPattern,
              })}
              autoComplete="off"
            />
            <FormErrorBadge error={hookForm.formState.errors.inviteMemberByEmailAddress} />
          </FormElement>
          {mode === 'project' && (
            <FormElement>
              <Label htmlFor="projectRole">
                {t('projects.projectRole', { defaultValue: 'Project role' })}
              </Label>
              <Select
                id="projectRole"
                value={hookForm.watch('projectRole')}
                onChange={(value) =>
                  hookForm.setValue('projectRole', value as ModelsUserProjectRoleEnum)
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
            </FormElement>
          )}
          {mode === 'organisation' && (
            <FormElement>
              <Label htmlFor="organisationRole">
                {t('organisations.organisationRole', { defaultValue: 'Organisation role' })}
              </Label>
              <Select
                id="organisationRole"
                value={hookForm.watch('organisationRole')}
                onChange={(value) =>
                  hookForm.setValue('organisationRole', value as ModelsUserOrganisationRoleEnum)
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
      {showResult && invitationResult && invitationResult.invitationLinkId && (
        <ModalConfirm onConfirm={handleCloseResult}>
          <div>
            {t('invitations.description.copyLink', {
              defaultValue:
                'Copy the link and send it to your colleague. If they do not have an account yet, one will be created when the invitation is accepted.',
            })}
          </div>
          <div className="flex gap-3 py-3">
            <code className="bg-base-200 rounded px-2 py-1">
              {registrationLink(invitationResult.invitationLinkId)}
            </code>

            <Button
              variant="icon"
              aria-label={t('invitations.copyToClipboard', { defaultValue: 'Copy to clipboard' })}
              onClick={() => copy(registrationLink(invitationResult.invitationLinkId || ''))}>
              <LucideIcon icon={Copy} size={16} />
            </Button>
          </div>
        </ModalConfirm>
      )}
      {showResult && invitationResult && !invitationResult.invitationLinkId && (
        <ModalConfirm onConfirm={handleCloseResult}>
          <div>
            {t('projects.status.assignedToUser', {
              defaultValue: 'Project successfully assigned to user.',
            })}
          </div>
          <div className="flex gap-3 py-3">
            <code className="bg-base-200 rounded px-2 py-1">{invitationResult.email}</code>
          </div>
        </ModalConfirm>
      )}
    </form>
  )
}
