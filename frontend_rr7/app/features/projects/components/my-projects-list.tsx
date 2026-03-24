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

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarProject } from '~/components/ui/data-display/avatar/avatar-project'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { ROLES } from '~/config/constants'
import { UserRoles } from '~/config/dynamic-translation-strings'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { EmptyStateProjects } from '~/features/projects/components/empty-state-projects'
import { MyProjectsListItemAdminContext } from '~/features/projects/components/my-projects-list-item-admin-context'
import { MyProjectsListItemMemberContext } from '~/features/projects/components/my-projects-list-item-member-context'
import { ProjectLastActivity } from '~/features/projects/components/project-last-activity'
import { type UserProjectWithActivity } from '~/types/common'

export type ProjectStatusFilter = 'active' | 'both' | 'inactive'

type Props = {
  projects: UserProjectWithActivity[]
  searchTerm: string
  statusFilter: ProjectStatusFilter
}

export const MyProjectsList = ({ projects, searchTerm }: Props) => {
  const { t } = useTranslation()

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects

    const searchLower = searchTerm.toLowerCase()
    return projects.filter((project) =>
      project.projectReference.key.toLowerCase().includes(searchLower),
    )
  }, [projects, searchTerm])

  if (projects.length === 0) {
    return <EmptyStateProjects />
  }

  return (
    <ContextMenuProvider>
      <DataList data-testid="project-list">
        <DataListRow>
          <DataListHeaderItem />
          <DataListHeaderItem>{t('forms.name', 'Name')}</DataListHeaderItem>
          <DataListHeaderItem>
            {t('projects:projectRole', 'Project role')}
          </DataListHeaderItem>
          <DataListHeaderItem>
            {t('projects:lastActivity', 'Last activity')}
          </DataListHeaderItem>
          <DataListHeaderItem />
        </DataListRow>
        {filteredProjects.map((item) => (
          <DataListRow
            data-testid="project-card"
            key={item.projectReference.id}
          >
            <DataListField width={90}>
              <AvatarProject name={item.projectReference.key} />
            </DataListField>
            <DataListField>
              <span>{item.projectReference.key}</span>
            </DataListField>
            <DataListField>
              <span>{UserRoles[item.role]}</span>
            </DataListField>
            <DataListField>
              <ProjectLastActivity lastActivityDate={item.lastActivityDate} />
            </DataListField>
            <DataListField>
              {item.role === ROLES.PROJECT_ADMIN ? (
                <MyProjectsListItemAdminContext item={item} />
              ) : (
                <MyProjectsListItemMemberContext item={item} />
              )}
            </DataListField>
          </DataListRow>
        ))}
      </DataList>
    </ContextMenuProvider>
  )
}
