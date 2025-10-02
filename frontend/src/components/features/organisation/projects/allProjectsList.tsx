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
}

export const AllProjectsList: React.FC<Props> = ({ statusFilter }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const { data } = useGetProjectList(selectedOrganisationId)
  const isClient = useIsClient()

  const filteredProjects = useMemo(() => {
    if (!data) return []

    switch (statusFilter) {
      case 'active':
        return data.filter((project) => project.active)
      case 'inactive':
        return data.filter((project) => !project.active)
      case 'both':
      default:
        return data
    }
  }, [data, statusFilter])

  if (!isClient) return null

  if (!data || data?.length === 0) {
    return <EmptyStateProjects />
  }

  return (
    <>
      <DataList>
        <DataListRow>
          <DataListHeaderItem />
          <DataListHeaderItem>{t('common.name', { defaultValue: 'Name' })}</DataListHeaderItem>
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
