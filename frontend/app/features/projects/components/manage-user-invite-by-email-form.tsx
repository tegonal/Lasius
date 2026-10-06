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

import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormField } from '~/components/ui/forms/conform/form-field'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { InviteAssignedResult } from '~/features/projects/components/invite/invite-assigned-result'
import { InviteLinkResult } from '~/features/projects/components/invite/invite-link-result'
import { InviteRoleSelect } from '~/features/projects/components/invite/invite-role-select'
import { type SchemaTranslationFunction, untyped } from '~/lib/i18n-types'
import { useInviteOrganisationUser } from '~/services/api/lasius-hooks/organisations/organisations'
import { useInviteProjectUser } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsInvitationResult } from '~/services/api/lasius/modelsInvitationResult'
import { type ModelsUserToOrganisationAssignmentRole } from '~/services/api/lasius/modelsUserToOrganisationAssignmentRole'
import { type ModelsUserToProjectAssignmentRole } from '~/services/api/lasius/modelsUserToProjectAssignmentRole'

type Properties = {
  onCancel?: () => void
  onSave: () => void
  organisation: string
  project?: string
}

const createInviteSchema = (t: SchemaTranslationFunction) =>
  z.object({
    inviteMemberByEmailAddress: z.email({
      error: t('validation.email', 'Please enter a valid email address'),
    }),
    organisationRole: z.string().default('OrganisationMember'),
    projectRole: z.string().default('ProjectMember'),
  })

export const ManageUserInviteByEmailForm = ({
  onCancel,
  onSave,
  organisation,
  project,
}: Properties) => {
  const { t } = useTranslation()

  const schema = useMemo(() => createInviteSchema(untyped(t)), [t])

  const [resetKey, setResetKey] = useState(0)
  const [invitationResult, setInvitationResult] = useState<ModelsInvitationResult | null>(null)

  const inviteProjectApi = useInviteProjectUser({ onSuccess: setInvitationResult })
  const inviteOrgApi = useInviteOrganisationUser({ onSuccess: setInvitationResult })
  const isSubmitting = inviteProjectApi.isLoading || inviteOrgApi.isLoading

  const [form, fields] = useForm<z.input<typeof schema>, z.output<typeof schema>>({
    constraint: getZodConstraint(schema),
    defaultValue: {
      inviteMemberByEmailAddress: '',
      organisationRole: 'OrganisationMember',
      projectRole: 'ProjectMember',
    },
    id: `invite-by-email-${resetKey}`,
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') return

      const { inviteMemberByEmailAddress, organisationRole, projectRole } = submission.value
      if (project && organisation) {
        inviteProjectApi.submit({
          body: {
            email: inviteMemberByEmailAddress,
            role: projectRole as ModelsUserToProjectAssignmentRole,
          },
          orgId: organisation,
          projectId: project,
        })
      } else if (organisation) {
        inviteOrgApi.submit({
          body: {
            email: inviteMemberByEmailAddress,
            role: organisationRole as ModelsUserToOrganisationAssignmentRole,
          },
          orgId: organisation,
        })
      }
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const handleCloseResult = () => {
    // The result view replaces the form, and form.reset() throws without a mounted form element.
    setResetKey((key) => key + 1)
    setInvitationResult(null)
    onSave()
  }

  if (invitationResult?.invitationLinkId) {
    return (
      <InviteLinkResult
        invitationId={invitationResult.invitationLinkId}
        onClose={handleCloseResult}
      />
    )
  }
  if (invitationResult) {
    return <InviteAssignedResult email={invitationResult.email} onClose={handleCloseResult} />
  }

  const handleClose = () => onCancel?.()

  const inviteDescriptions = {
    organisation: t(
      'invitation:inviteOrganisationDescription',
      'Enter the email address of the person you want to invite. An invitation link will be generated that you can send to them.',
    ),
    project: t(
      'invitation:inviteProjectDescription',
      'Enter the email address of the person you want to invite. An invitation link will be generated that you can send to them.',
    ),
  }

  return (
    <form {...getFormProps(form)}>
      <FormBody>
        <ModalCloseButton onClose={handleClose} />

        <ModalHeader className="mb-2">
          {t('organisation:members.actions.invite', 'Invite someone')}
        </ModalHeader>

        <ModalDescription className="mb-4">
          {inviteDescriptions[project ? 'project' : 'organisation']}
        </ModalDescription>

        <FieldSet>
          <FormField
            autoComplete="off"
            data-testid="org-invite-email-input"
            field={fields.inviteMemberByEmailAddress}
            label={t('invitation:email', 'Email')}
            type="email"
          />
          {project ? (
            <InviteRoleSelect
              field={fields.projectRole}
              label={t('projects:projectRole', 'Project role')}
              scope="project"
            />
          ) : (
            <InviteRoleSelect
              field={fields.organisationRole}
              label={t('organisation:organisationRole', 'Organisation role')}
              scope="organisation"
            />
          )}
        </FieldSet>

        <ButtonGroup>
          <Button
            data-testid="org-invite-submit-btn"
            disabled={isSubmitting}
            type="submit"
            variant="primary">
            {t('organisation:members.actions.invite', 'Invite someone')}
          </Button>
          <Button onClick={handleClose} type="button" variant="secondary">
            {t('actions.cancel', 'Cancel')}
          </Button>
        </ButtonGroup>
      </FormBody>
    </form>
  )
}
