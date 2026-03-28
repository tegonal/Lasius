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

import { getFormProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Copy } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Label } from '~/components/primitives/typography/label'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormField } from '~/components/ui/forms/conform/form-field'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { Select } from '~/components/ui/forms/input/select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { UserRoles } from '~/config/dynamic-translation-strings'
import { validateFormData } from '~/lib/conform-helpers'
import { type SchemaTranslationFn, untyped } from '~/lib/i18n-types'
import { useInviteOrganisationUser } from '~/services/api/lasius-hooks/organisations/organisations'
import { useInviteProjectUser } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsInvitationResult } from '~/services/api/lasius/modelsInvitationResult'
import { type ModelsUserToOrganisationAssignmentRole } from '~/services/api/lasius/modelsUserToOrganisationAssignmentRole'
import { type ModelsUserToProjectAssignmentRole } from '~/services/api/lasius/modelsUserToProjectAssignmentRole'

type Props = {
  onCancel?: () => void
  onSave: () => void
  organisation: string
  project?: string
}

const createInviteSchema = (t: SchemaTranslationFn) =>
  z.object({
    inviteMemberByEmailAddress: z
      .string({
        error: t('validation.email', 'Please enter a valid email address'),
      })
      .email({
        message: t('validation.email', 'Please enter a valid email address'),
      }),
    organisationRole: z.string().default('OrganisationMember'),
    projectRole: z.string().default('ProjectMember'),
  })

export const ManageUserInviteByEmailForm = ({
  onCancel,
  onSave,
  organisation,
  project,
}: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const mode = project ? 'project' : 'organisation'

  const schema = useMemo(() => createInviteSchema(untyped(t)), [t])

  const [showResultState, setShowResultState] = useState(false)
  const [invitationResult, setInvitationResult] =
    useState<ModelsInvitationResult | null>(null)

  const handleInviteSuccess = useCallback((result: ModelsInvitationResult) => {
    setInvitationResult(result)
    setShowResultState(true)
  }, [])

  const inviteProjectApi = useInviteProjectUser({
    onSuccess: handleInviteSuccess,
  })
  const inviteOrgApi = useInviteOrganisationUser({
    onSuccess: handleInviteSuccess,
  })
  const isSubmitting = inviteProjectApi.isLoading || inviteOrgApi.isLoading

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      inviteMemberByEmailAddress: '',
      organisationRole: 'OrganisationMember',
      projectRole: 'ProjectMember',
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const projectRoleControl = useInputControl(fields.projectRole)
  const orgRoleControl = useInputControl(fields.organisationRole)

  const handleCloseResult = () => {
    form.reset()
    setShowResultState(false)
    setInvitationResult(null)
    onSave()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = validateFormData(e.currentTarget, schema)
    if (result.status !== 'success') return

    const { inviteMemberByEmailAddress, organisationRole, projectRole } =
      result.value

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
  }

  const registrationLink = (invitationId: string) => {
    const url = new URL(globalThis.location.toString())
    return `${url.protocol}//${url.host}/join/${invitationId}`
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        addToast({
          message: t(
            'invitation:copiedToClipboard',
            'Link copied to clipboard',
          ),
          ttl: 3000,
          type: 'SUCCESS',
        })
      },
      () => {
        addToast({
          message: t('invitation:copyFailed', 'Failed to copy link'),
          ttl: 3000,
          type: 'ERROR',
        })
      },
    )
  }

  const handleClose = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <>
      {!showResultState && (
        <form {...getFormProps(form)} onSubmit={handleSubmit}>
          <FormBody>
            <ModalCloseButton onClose={handleClose} />

            <ModalHeader className="mb-2">
              {t('organisation:members.actions.invite', 'Invite someone')}
            </ModalHeader>

            <ModalDescription className="mb-4">
              {mode === 'project'
                ? t(
                    'invitation:inviteProjectDescription',
                    'Enter the email address of the person you want to invite. An invitation link will be generated that you can send to them.',
                  )
                : t(
                    'invitation:inviteOrganisationDescription',
                    'Enter the email address of the person you want to invite. An invitation link will be generated that you can send to them.',
                  )}
            </ModalDescription>

            <FieldSet>
              <FormField
                autoComplete="off"
                data-testid="org-invite-email-input"
                field={fields.inviteMemberByEmailAddress}
                label={t('invitation:email', 'Email')}
                type="email"
              />
              {mode === 'project' && (
                <FormElement>
                  <Label htmlFor={fields.projectRole.id}>
                    {t('projects:projectRole', 'Project role')}
                  </Label>
                  <input
                    name={fields.projectRole.name}
                    type="hidden"
                    value={projectRoleControl.value ?? 'ProjectMember'}
                  />
                  <Select
                    id={fields.projectRole.id}
                    onChange={(value) => projectRoleControl.change(value)}
                    options={[
                      {
                        label: UserRoles.ProjectMember || 'Member',
                        value: 'ProjectMember',
                      },
                      {
                        label:
                          UserRoles.ProjectAdministrator || 'Administrator',
                        value: 'ProjectAdministrator',
                      },
                    ]}
                    value={projectRoleControl.value || 'ProjectMember'}
                  />
                </FormElement>
              )}
              {mode === 'organisation' && (
                <FormElement>
                  <Label htmlFor={fields.organisationRole.id}>
                    {t('organisation:organisationRole', 'Organisation role')}
                  </Label>
                  <input
                    name={fields.organisationRole.name}
                    type="hidden"
                    value={orgRoleControl.value ?? 'OrganisationMember'}
                  />
                  <Select
                    id={fields.organisationRole.id}
                    onChange={(value) => orgRoleControl.change(value)}
                    options={[
                      {
                        label: UserRoles.OrganisationMember || 'Member',
                        value: 'OrganisationMember',
                      },
                      {
                        label:
                          UserRoles.OrganisationAdministrator ||
                          'Administrator',
                        value: 'OrganisationAdministrator',
                      },
                    ]}
                    value={orgRoleControl.value || 'OrganisationMember'}
                  />
                </FormElement>
              )}
            </FieldSet>

            <ButtonGroup>
              <Button
                data-testid="org-invite-submit-btn"
                disabled={isSubmitting}
                type="submit"
                variant="primary"
              >
                {t('organisation:members.actions.invite', 'Invite someone')}
              </Button>
              <Button onClick={handleClose} type="button" variant="secondary">
                {t('actions.cancel', 'Cancel')}
              </Button>
            </ButtonGroup>
          </FormBody>
        </form>
      )}

      {showResultState &&
        invitationResult &&
        invitationResult.invitationLinkId && (
          <FormBody>
            <ModalCloseButton onClose={handleCloseResult} />

            <ModalHeader>
              {t('invitation:title.invitationCreated', 'Invitation created')}
            </ModalHeader>

            <ModalDescription>
              {t(
                'invitation:description.copyLink',
                'Copy the link and send it to your colleague. If they do not have an account yet, one will be created when the invitation is accepted.',
              )}
            </ModalDescription>

            <div className="flex gap-3">
              <code
                className="bg-base-200 flex-1 rounded px-2 py-1"
                data-testid="org-invite-link"
              >
                {registrationLink(invitationResult.invitationLinkId)}
              </code>

              <Button
                aria-label={t(
                  'invitation:copyToClipboard',
                  'Copy to clipboard',
                )}
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
                {t('actions.close', 'Close')}
              </Button>
            </ButtonGroup>
          </FormBody>
        )}

      {showResultState &&
        invitationResult &&
        !invitationResult.invitationLinkId && (
          <FormBody>
            <ModalCloseButton onClose={handleCloseResult} />

            <ModalHeader>
              {t('invitation:title.userAssigned', 'User assigned')}
            </ModalHeader>

            <ModalDescription>
              {t(
                'projects:status.assignedToUser',
                'Project successfully assigned to user.',
              )}
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
                {t('actions.close', 'Close')}
              </Button>
            </ButtonGroup>
          </FormBody>
        )}
    </>
  )
}
