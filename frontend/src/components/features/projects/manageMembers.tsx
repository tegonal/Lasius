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

import { UserCard } from 'components/features/user/manageUserCard'
import { ManageUserInviteByEmailForm } from 'components/features/user/manageUserInviteByEmailForm'
import { Heading } from 'components/primitives/typography/Heading'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { isAdminOfProject } from 'lib/api/functions/isAdminOfProject'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsProject, ModelsUserProject, ModelsUserStub } from 'lib/api/lasius'
import { getProjectUserList, removeProjectUser } from 'lib/api/lasius/projects/projects'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

type Props = {
  item: ModelsProject | ModelsUserProject
  onSave: () => void
  onCancel: () => void
}

export const ManageProjectMembers: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const projectId = 'id' in item ? item.id : item.projectReference.id
  const projectOrganisationId =
    'organisationReference' in item ? item.organisationReference.id : selectedOrganisationId
  const { profile } = useProfile()
  const amIAdmin = isAdminOfProject(profile, projectOrganisationId, projectId)
  const [users, setUsers] = useState<ModelsUserStub[]>([])
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false)
  useEffect(() => {
    getProjectUserList(selectedOrganisationId, projectId).then((data) => setUsers(data))
  }, [item, refreshFlag, selectedOrganisationId, projectId])

  const handleUserInvite = () => {
    //
    setRefreshFlag(!refreshFlag)
  }

  const handleUserRemove = async (userId: string) => {
    await removeProjectUser(selectedOrganisationId, projectId, userId).then((_) =>
      setRefreshFlag(!refreshFlag),
    )
  }

  return (
    <FieldSet>
      <div className="relative w-full">
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <div>
            <div className="border-base-content/20 mb-2 flex items-baseline justify-between border-b pb-2">
              <div className="flex gap-2">
                {t('projects.members.title', { defaultValue: 'Project members' })}
              </div>
              <span className="text-sm font-normal">{users?.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pb-3">
              {users?.map((user) => (
                <UserCard
                  canRemove={amIAdmin}
                  user={user}
                  key={user.id}
                  onRemove={() => handleUserRemove(user.id)}
                />
              ))}
            </div>
          </div>
          <div>
            <Heading as="h2" variant="section">
              {t('members.actions.invite', { defaultValue: 'Invite someone' })}
            </Heading>
            <ManageUserInviteByEmailForm
              organisation={projectOrganisationId}
              project={projectId}
              onSave={handleUserInvite}
            />
          </div>
        </div>
      </div>
    </FieldSet>
  )
}
