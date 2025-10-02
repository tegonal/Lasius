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

import { ManageProjectMembersStats } from 'components/features/projects/manageProjectMembersStats'
import { ProjectMembersList } from 'components/features/projects/projectMembersList'
import { ManageUserInviteByEmailForm } from 'components/features/user/manageUserInviteByEmailForm'
import { Button } from 'components/primitives/buttons/Button'
import { FormElement } from 'components/ui/forms/FormElement'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsProject, ModelsUserProject, ModelsUserStub } from 'lib/api/lasius'
import { getProjectUserList } from 'lib/api/lasius/projects/projects'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

type Props = {
  item: ModelsProject | ModelsUserProject
  onSave: () => void
  onCancel: () => void
}

export const ManageProjectMembers: React.FC<Props> = ({ item, onCancel }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const projectId = 'id' in item ? item.id : item.projectReference.id
  const projectOrganisationId =
    'organisationReference' in item ? item.organisationReference.id : selectedOrganisationId
  const [users, setUsers] = useState<ModelsUserStub[]>([])
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  useEffect(() => {
    getProjectUserList(selectedOrganisationId, projectId).then((data) => setUsers(data))
  }, [item, refreshFlag, selectedOrganisationId, projectId])

  const handleUserInvite = () => {
    setRefreshFlag(!refreshFlag)
    setIsInviteOpen(false)
  }

  const handleRefresh = () => {
    setRefreshFlag(!refreshFlag)
  }

  const handleInviteOpen = () => {
    setIsInviteOpen(true)
  }

  const handleInviteClose = () => {
    setIsInviteOpen(false)
  }

  return (
    <>
      <ManageProjectMembersStats memberCount={users.length} onInvite={handleInviteOpen} />
      <div className="px-4 pt-3">
        <ProjectMembersList
          users={users}
          projectId={projectId}
          projectOrganisationId={projectOrganisationId}
          onRefresh={handleRefresh}
        />
      </div>
      <FormElement>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.actions.close', { defaultValue: 'Close' })}
        </Button>
      </FormElement>
      <Modal open={isInviteOpen} onClose={handleInviteClose}>
        <ManageUserInviteByEmailForm
          organisation={projectOrganisationId}
          project={projectId}
          onSave={handleUserInvite}
          onCancel={handleInviteClose}
        />
      </Modal>
    </>
  )
}
