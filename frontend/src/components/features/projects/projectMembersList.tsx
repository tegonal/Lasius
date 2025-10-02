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

import { ProjectMemberListItemContext } from 'components/features/projects/projectMemberListItemContext'
import { AvatarUser } from 'components/ui/data-display/avatar/avatarUser'
import { Badge } from 'components/ui/data-display/Badge'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { EmptyStateMembers } from 'components/ui/data-display/fetchState/emptyStateMembers'
import { orderBy } from 'es-toolkit'
import { isAdminOfProject } from 'lib/api/functions/isAdminOfProject'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsUserStub } from 'lib/api/lasius'
import { removeProjectUser } from 'lib/api/lasius/projects/projects'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

type Props = {
  users: ModelsUserStub[]
  projectId: string
  projectOrganisationId: string
  onRefresh: () => void
}

export const ProjectMembersList: React.FC<Props> = ({
  users,
  projectId,
  projectOrganisationId,
  onRefresh,
}) => {
  const { profile, userId } = useProfile()
  const amIAdmin = isAdminOfProject(profile, projectOrganisationId, projectId)
  const { t } = useTranslation('common')
  const isClient = useIsClient()

  const handleUserRemove = async (userIdToRemove: string) => {
    await removeProjectUser(projectOrganisationId, projectId, userIdToRemove)
    onRefresh()
  }

  if (!isClient) return null

  if (!users || users.length === 0) {
    return <EmptyStateMembers />
  }

  return (
    <DataList>
      <DataListRow>
        <DataListHeaderItem />
        <DataListHeaderItem>
          {t('common.firstName', { defaultValue: 'First name' })}
        </DataListHeaderItem>
        <DataListHeaderItem>
          {t('common.lastName', { defaultValue: 'Last name' })}
        </DataListHeaderItem>
        <DataListHeaderItem>{t('common.email', { defaultValue: 'Email' })}</DataListHeaderItem>
        <DataListHeaderItem>
          {t('common.status.label', { defaultValue: 'Status' })}
        </DataListHeaderItem>
        <DataListHeaderItem />
      </DataListRow>
      {orderBy(users, [(user) => user.lastName, (user) => user.firstName], ['asc', 'asc']).map(
        (user) => (
          <DataListRow key={user.id}>
            <DataListField width={90}>
              <AvatarUser firstName={user.firstName} lastName={user.lastName} />
            </DataListField>
            <DataListField>
              <span>{user.firstName}</span>
            </DataListField>
            <DataListField>
              <span>{user.lastName}</span>
            </DataListField>
            <DataListField>
              <span>{user.email}</span>
            </DataListField>
            <DataListField>
              {user.id === userId && (
                <Badge variant="tag">{t('common.you', { defaultValue: 'You' })}</Badge>
              )}
            </DataListField>
            <DataListField>
              <ProjectMemberListItemContext
                user={user}
                onRemove={() => handleUserRemove(user.id)}
                canRemove={amIAdmin}
              />
            </DataListField>
          </DataListRow>
        ),
      )}
    </DataList>
  )
}
