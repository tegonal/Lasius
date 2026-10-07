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

import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormBody } from '~/components/ui/forms/form-body'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { AddExistingMemberRow } from '~/features/projects/components/add-existing-member-row'
import { useOrganisationUsers } from '~/features/projects/hooks/use-organisation-users'
import {
  getMemberListView,
  selectAvailableMembers,
} from '~/features/projects/lib/available-members'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useInviteProjectUser } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsUserToProjectAssignmentRole } from '~/services/api/lasius/modelsUserToProjectAssignmentRole'

type Properties = {
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
}: Properties) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const { isLoading, orgUsers } = useOrganisationUsers(orgId)
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set())
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [addingUserId, setAddingUserId] = useState<null | string>(null)
  const addingUserIdReference = useRef<null | string>(null)

  const inviteApi = useInviteProjectUser({
    onError: useCallback(() => {
      addingUserIdReference.current = null
      setAddingUserId(null)
      addToast({
        message: t('invitation:memberAddFailed', 'Failed to add member'),
        ttl: 3000,
        type: 'ERROR',
      })
    }, [addToast, t]),
    onSuccess: useCallback(() => {
      const userId = addingUserIdReference.current
      addingUserIdReference.current = null
      setAddedUserIds((previous) => {
        if (!userId) return previous
        return new Set([...previous, userId])
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

  const availableMembers = useMemo(
    () => selectAvailableMembers(orgUsers, new Set(projectUsers.map((u) => u.id)), addedUserIds),
    [orgUsers, projectUsers, addedUserIds],
  )
  const view = getMemberListView(isLoading, availableMembers.length)

  const handleRoleChange = (userId: string, role: string) => {
    setRoles((previous) => ({ ...previous, [userId]: role }))
  }

  const handleAdd = (user: ModelsUserStub) => {
    const role = (roles[user.id] || 'ProjectMember') as ModelsUserToProjectAssignmentRole
    addingUserIdReference.current = user.id
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
        {view === 'loading' && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}

        {view === 'empty' && (
          <p className="text-base-content/60 py-8 text-center">
            {t(
              'invitation:addExistingMembers.empty',
              'All organisation members are already in this project.',
            )}
          </p>
        )}

        {view === 'list' && (
          <DataList>
            <DataListRow>
              <DataListHeaderItem />
              <DataListHeaderItem>{t('forms.firstName', 'First name')}</DataListHeaderItem>
              <DataListHeaderItem>{t('forms.lastName', 'Last name')}</DataListHeaderItem>
              <DataListHeaderItem>{t('projects:projectRole', 'Project role')}</DataListHeaderItem>
              <DataListHeaderItem />
            </DataListRow>
            {availableMembers.map((user) => (
              <AddExistingMemberRow
                isAdding={addingUserId === user.id}
                isDisabled={!!addingUserId}
                key={user.id}
                onAdd={() => handleAdd(user)}
                onRoleChange={(value) => handleRoleChange(user.id, value)}
                role={roles[user.id] || 'ProjectMember'}
                user={user}
              />
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
