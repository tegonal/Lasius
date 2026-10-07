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

import { useRouteLoaderData } from 'react-router'

import { MemberDataList } from '~/components/ui/data-display/member-data-list'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { EmptyStateMembers } from '~/features/projects/components/empty-state-members'
import { isAdminOfProject } from '~/lib/api/functions/is-admin-of-project'
import { type loader } from '~/routes/app-layout'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useRemoveProjectUser } from '~/services/api/lasius-hooks/projects/projects'

import { ProjectMemberListItemContext } from './project-member-list-item-context'

type Properties = {
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
}: Properties) => {
  const loaderData = useRouteLoaderData<typeof loader>('routes/app-layout')
  const userId = loaderData?.user?.id

  const isAmIAdmin = isAdminOfProject(loaderData?.user, projectOrganisationId, projectId)

  const memberRemovalApi = useRemoveProjectUser({
    onSuccess: () => {
      onRefresh()
    },
  })

  if (users.length === 0) {
    return <EmptyStateMembers />
  }

  const handleUserRemove = (userIdToRemove: string) => {
    memberRemovalApi.submit({
      orgId: projectOrganisationId,
      projectId,
      userId: userIdToRemove,
    })
  }

  return (
    <ContextMenuProvider>
      <MemberDataList
        currentUserId={userId}
        renderActions={(user) => (
          <ProjectMemberListItemContext
            canRemove={isAmIAdmin && users.length > 1}
            onRemove={() => handleUserRemove(user.id)}
            user={user}
          />
        )}
        users={users}
      />
    </ContextMenuProvider>
  )
}
