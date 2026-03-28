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

import { orderBy } from 'es-toolkit'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { AvatarUser } from '~/components/ui/data-display/avatar/avatar-user'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormBody } from '~/components/ui/forms/form-body'
import { Select } from '~/components/ui/forms/input/select'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { UserRoles } from '~/config/dynamic-translation-strings'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useGetOrganisationUserList } from '~/services/api/lasius-hooks/organisations/organisations'
import { useInviteProjectUser } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsUserToProjectAssignmentRole } from '~/services/api/lasius/modelsUserToProjectAssignmentRole'

type Props = {
  onCancel: () => void
  onMemberAdded: () => void
  orgId: string
  projectId: string
  projectUsers: ModelsUserStub[]
}

export const AddExistingMemberList = ({
  onCancel,
  onMemberAdded,
  orgId,
  projectId,
  projectUsers,
}: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [orgUsers, setOrgUsers] = useState<ModelsUserStub[]>([])
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set())
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [addingUserId, setAddingUserId] = useState<null | string>(null)
  const addingUserIdRef = useRef<null | string>(null)

  const orgUserListApi = useGetOrganisationUserList({
    onSuccess: useCallback((data: ModelsUserStub[]) => {
      setOrgUsers(Array.isArray(data) ? data : [])
    }, []),
  })

  const inviteApi = useInviteProjectUser({
    onError: useCallback(() => {
      addingUserIdRef.current = null
      setAddingUserId(null)
      addToast({
        message: t('invitation:memberAddFailed', 'Failed to add member'),
        ttl: 3000,
        type: 'ERROR',
      })
    }, [addToast, t]),
    onSuccess: useCallback(() => {
      const userId = addingUserIdRef.current
      addingUserIdRef.current = null
      setAddedUserIds((prev) => {
        if (!userId) return prev
        return new Set([...prev, userId])
      })
      setAddingUserId(null)
      onMemberAdded()
      addToast({
        message: t('invitation:memberAdded', 'Member added to project'),
        ttl: 3000,
        type: 'SUCCESS',
      })
    }, [onMemberAdded, addToast, t]),
  })

  const submitOrgUserList = orgUserListApi.submit
  useEffect(() => {
    submitOrgUserList({ orgId })
  }, [orgId, submitOrgUserList])

  const projectUserIds = useMemo(
    () => new Set(projectUsers.map((u) => u.id)),
    [projectUsers],
  )

  const availableMembers = useMemo(
    () =>
      orderBy(
        orgUsers.filter(
          (u) => !projectUserIds.has(u.id) && !addedUserIds.has(u.id),
        ),
        [(u) => u.lastName, (u) => u.firstName],
        ['asc', 'asc'],
      ),
    [orgUsers, projectUserIds, addedUserIds],
  )

  const handleRoleChange = (userId: string, role: string) => {
    setRoles((prev) => ({ ...prev, [userId]: role }))
  }

  const handleAdd = (user: ModelsUserStub) => {
    const role = (roles[user.id] ||
      'ProjectMember') as ModelsUserToProjectAssignmentRole
    addingUserIdRef.current = user.id
    setAddingUserId(user.id)
    inviteApi.submit({
      body: { email: user.email, role },
      orgId,
      projectId,
    })
  }

  return (
    <FormBody>
      <ModalCloseButton onClose={onCancel} />

      <ModalHeader className="mb-2">
        {t('invitation:addExistingMembers.title', 'Add existing members')}
      </ModalHeader>

      <ModalDescription className="mb-4">
        {t(
          'invitation:addExistingMembers.description',
          'Select organisation members to add to this project.',
        )}
      </ModalDescription>

      <ModalBody>
        {orgUserListApi.isLoading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}

        {!orgUserListApi.isLoading && availableMembers.length === 0 && (
          <p className="text-base-content/60 py-8 text-center">
            {t(
              'invitation:addExistingMembers.empty',
              'All organisation members are already in this project.',
            )}
          </p>
        )}

        {!orgUserListApi.isLoading && availableMembers.length > 0 && (
          <DataList>
            <DataListRow>
              <DataListHeaderItem />
              <DataListHeaderItem>
                {t('forms.firstName', 'First name')}
              </DataListHeaderItem>
              <DataListHeaderItem>
                {t('forms.lastName', 'Last name')}
              </DataListHeaderItem>
              <DataListHeaderItem>
                {t('projects:projectRole', 'Project role')}
              </DataListHeaderItem>
              <DataListHeaderItem />
            </DataListRow>
            {availableMembers.map((user) => (
              <DataListRow key={user.id}>
                <DataListField width={90}>
                  <AvatarUser
                    firstName={user.firstName}
                    lastName={user.lastName}
                  />
                </DataListField>
                <DataListField>
                  <span>{user.firstName}</span>
                </DataListField>
                <DataListField>
                  <span>{user.lastName}</span>
                </DataListField>
                <DataListField>
                  <Select
                    onChange={(value) => handleRoleChange(user.id, value)}
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
                    value={roles[user.id] || 'ProjectMember'}
                  />
                </DataListField>
                <DataListField>
                  <Button
                    disabled={!!addingUserId}
                    fullWidth={false}
                    onClick={() => handleAdd(user)}
                    size="sm"
                    variant="primary"
                  >
                    {addingUserId === user.id
                      ? t('actions.adding', 'Adding...')
                      : t('invitation:addExistingMembers.addButton', 'Add')}
                  </Button>
                </DataListField>
              </DataListRow>
            ))}
          </DataList>
        )}
      </ModalBody>

      <ButtonGroup>
        <Button onClick={onCancel} type="button" variant="secondary">
          {t('actions.close', 'Close')}
        </Button>
      </ButtonGroup>
    </FormBody>
  )
}
