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

import { AllProjectsListItemContext } from 'components/features/organisation/projects/allProjectsListItemContext'
import { AvatarProject } from 'components/ui/data-display/avatar/avatarProject'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { EmptyStateProjects } from 'components/ui/data-display/fetchState/emptyStateProjects'
import { ProjectLastActivity } from 'components/ui/data-display/ProjectLastActivity'
import { orderBy } from 'es-toolkit'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetProjectList } from 'lib/api/lasius/projects/projects'
import { stringHash } from 'lib/utils/string/stringHash'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

export type ProjectStatusFilter = 'both' | 'active' | 'inactive'

type Props = {
  statusFilter: ProjectStatusFilter
  searchTerm: string
}

export const AllProjectsList: React.FC<Props> = ({ statusFilter, searchTerm }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const { data } = useGetProjectList(selectedOrganisationId)
  const isClient = useIsClient()

  const filteredProjects = useMemo(() => {
    if (!data) return []

    let filtered = data

    // Filter by status
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter((project) => project.active)
        break
      case 'inactive':
        filtered = filtered.filter((project) => !project.active)
        break
      case 'both':
      default:
        break
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((project) => project.key.toLowerCase().includes(searchLower))
    }

    return filtered
  }, [data, statusFilter, searchTerm])

  if (!isClient) return null

  if (!data || data?.length === 0) {
    return <EmptyStateProjects />
  }

  return (
    <>
      <DataList>
        <DataListRow>
          <DataListHeaderItem />
          <DataListHeaderItem>
            {t('common.forms.name', { defaultValue: 'Name' })}
          </DataListHeaderItem>
          <DataListHeaderItem>
            {t('common.status.label', { defaultValue: 'Status' })}
          </DataListHeaderItem>
          <DataListHeaderItem>
            {t('projects.lastActivity', { defaultValue: 'Last activity' })}
          </DataListHeaderItem>
          <DataListHeaderItem />
        </DataListRow>
        {orderBy(filteredProjects, [(data) => data.key], ['asc']).map((item) => (
          <DataListRow key={stringHash(item)}>
            <DataListField width={90}>
              <AvatarProject name={item.key} />
            </DataListField>
            <DataListField>
              <span>{item.key}</span>
            </DataListField>
            <DataListField>
              <span>
                {item.active
                  ? t('common.status.active', { defaultValue: 'Active' })
                  : t('common.status.inactive', { defaultValue: 'Inactive' })}
              </span>
            </DataListField>
            <DataListField>
              <ProjectLastActivity orgId={selectedOrganisationId} projectId={item.id} />
            </DataListField>
            <DataListField>
              <AllProjectsListItemContext item={item} />
            </DataListField>
          </DataListRow>
        ))}
      </DataList>
    </>
  )
}
