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

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { Modal } from '~/components/ui/overlays/modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useGetProjectUserList } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

import { ManageProjectMembersStats } from './manage-project-members-stats'
import { ManageUserInviteByEmailForm } from './manage-user-invite-by-email-form'
import { ProjectMembersList } from './project-members-list'

type Props = {
  item: ModelsProject | ModelsUserProject
  onCancel?: () => void
  onSave: () => void
}

export const ManageProjectMembers = ({ item, onCancel }: Props) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const projectId = 'id' in item ? item.id : item.projectReference.id
  const projectOrganisationId =
    'organisationReference' in item
      ? item.organisationReference.id
      : selectedOrganisationId
  const [users, setUsers] = useState<ModelsUserStub[]>([])
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const handleUserListSuccess = useCallback((data: ModelsUserStub[]) => {
    const list = Array.isArray(data) ? data : []
    setUsers(list)
  }, [])

  const userListApi = useGetProjectUserList({
    onSuccess: handleUserListSuccess,
  })

  // Initial load
  useEffect(() => {
    userListApi.submit({
      orgId: selectedOrganisationId,
      projectId,
    })
  }, [selectedOrganisationId, projectId, userListApi])

  const handleUserInvite = () => {
    // Reload members after invite
    userListApi.submit({
      orgId: selectedOrganisationId,
      projectId,
    })
    setIsInviteOpen(false)
  }

  const handleRefresh = () => {
    userListApi.submit({
      orgId: selectedOrganisationId,
      projectId,
    })
  }

  const handleInviteOpen = () => {
    setIsInviteOpen(true)
  }

  const handleInviteClose = () => {
    setIsInviteOpen(false)
  }

  const handleClose = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <ModalCloseButton onClose={handleClose} />
        <ModalHeader className="mb-4">
          {t('members.title', { defaultValue: 'Members' })}
        </ModalHeader>
        <ManageProjectMembersStats
          memberCount={users.length}
          onInvite={handleInviteOpen}
        />
        <ScrollArea className="min-h-0 grow">
          <ProjectMembersList
            onRefresh={handleRefresh}
            projectId={projectId}
            projectOrganisationId={projectOrganisationId}
            users={users}
          />
        </ScrollArea>
        <ButtonGroup>
          <Button onClick={handleClose} type="button" variant="secondary">
            {t('common.actions.close', {
              defaultValue: 'Close',
            })}
          </Button>
        </ButtonGroup>
      </div>
      <Modal onClose={handleInviteClose} open={isInviteOpen}>
        <ManageUserInviteByEmailForm
          onCancel={handleInviteClose}
          onSave={handleUserInvite}
          organisation={projectOrganisationId}
          project={projectId}
        />
      </Modal>
    </>
  )
}
