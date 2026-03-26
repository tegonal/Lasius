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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarProject } from '~/components/ui/data-display/avatar/avatar-project'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { AllProjectsListItemContext } from '~/features/projects/components/all-projects-list-item-context'
import { EmptyStateProjects } from '~/features/projects/components/empty-state-projects'
import { ProjectLastActivity } from '~/features/projects/components/project-last-activity'
import { type ProjectWithActivity } from '~/types/common'

export type ProjectStatusFilter = 'active' | 'both' | 'inactive'

type Props = {
  projects: ProjectWithActivity[]
  searchTerm: string
  statusFilter: ProjectStatusFilter
}

export const AllProjectsList = ({
  projects,
  searchTerm,
  statusFilter,
}: Props) => {
  const { t } = useTranslation()

  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Filter by status
    switch (statusFilter) {
      case 'active': {
        filtered = filtered.filter((project) => project.active)
        break
      }
      case 'inactive': {
        filtered = filtered.filter((project) => !project.active)
        break
      }
      default: {
        break
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((project) =>
        project.key.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [projects, statusFilter, searchTerm])

  if (projects.length === 0) {
    return <EmptyStateProjects />
  }

  return (
    <ContextMenuProvider>
      <DataList data-testid="project-list">
        <DataListRow>
          <DataListHeaderItem />
          <DataListHeaderItem>{t('forms.name', 'Name')}</DataListHeaderItem>
          <DataListHeaderItem>{t('status.label', 'Status')}</DataListHeaderItem>
          <DataListHeaderItem>
            {t('projects:lastActivity', 'Last activity')}
          </DataListHeaderItem>
          <DataListHeaderItem />
        </DataListRow>
        {orderBy(filteredProjects, [(data) => data.key], ['asc']).map(
          (item) => (
            <DataListRow data-testid="project-card" key={item.id}>
              <DataListField width={90}>
                <AvatarProject name={item.key} />
              </DataListField>
              <DataListField>
                <span>{item.key}</span>
              </DataListField>
              <DataListField>
                <span>
                  {item.active
                    ? t('status.active', 'Active')
                    : t('status.inactive', 'Inactive')}
                </span>
              </DataListField>
              <DataListField>
                <ProjectLastActivity lastActivityDate={item.lastActivityDate} />
              </DataListField>
              <DataListField>
                <AllProjectsListItemContext item={item} />
              </DataListField>
            </DataListRow>
          ),
        )}
      </DataList>
    </ContextMenuProvider>
  )
}
