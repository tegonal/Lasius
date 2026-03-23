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
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import { AvatarUser } from '~/components/ui/data-display/avatar/avatar-user'
import { Badge } from '~/components/ui/data-display/badge'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { EmptyStateMembers } from '~/features/projects/components/empty-state-members'
import { isAdminOfProject } from '~/lib/api/functions/is-admin-of-project'
import { type loader } from '~/routes/app-layout'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useRemoveProjectUser } from '~/services/api/lasius-hooks/projects/projects'

import { ProjectMemberListItemContext } from './project-member-list-item-context'

type Props = {
  onRefresh: () => void
  projectId: string
  projectOrganisationId: string
  users: ModelsUserStub[]
}

export const ProjectMembersList = ({
  onRefresh,
  projectId,
  projectOrganisationId,
  users,
}: Props) => {
  const { t } = useTranslation('common')
  const loaderData = useRouteLoaderData<typeof loader>('routes/app-layout')
  const userId = loaderData?.user?.id

  const amIAdmin = isAdminOfProject(
    loaderData?.user,
    projectOrganisationId,
    projectId,
  )

  const removeUserApi = useRemoveProjectUser({
    onSuccess: () => {
      onRefresh()
    },
  })

  const handleUserRemove = (userIdToRemove: string) => {
    removeUserApi.submit({
      orgId: projectOrganisationId,
      projectId,
      userId: userIdToRemove,
    })
  }

  if (users.length === 0) {
    return <EmptyStateMembers />
  }

  return (
    <DataList>
      <DataListRow>
        <DataListHeaderItem />
        <DataListHeaderItem>
          {t('common.forms.firstName', { defaultValue: 'First name' })}
        </DataListHeaderItem>
        <DataListHeaderItem>
          {t('common.forms.lastName', { defaultValue: 'Last name' })}
        </DataListHeaderItem>
        <DataListHeaderItem>
          {t('common.forms.email', { defaultValue: 'Email' })}
        </DataListHeaderItem>
        <DataListHeaderItem>
          {t('common.status.label', { defaultValue: 'Status' })}
        </DataListHeaderItem>
        <DataListHeaderItem />
      </DataListRow>
      {orderBy(
        users,
        [(user) => user.lastName, (user) => user.firstName],
        ['asc', 'asc'],
      ).map((user) => (
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
              <Badge variant="tag">
                {t('common.you', { defaultValue: 'You' })}
              </Badge>
            )}
          </DataListField>
          <DataListField>
            <ProjectMemberListItemContext
              canRemove={amIAdmin && users.length > 1}
              onRemove={() => handleUserRemove(user.id)}
              user={user}
            />
          </DataListField>
        </DataListRow>
      ))}
    </DataList>
  )
}
