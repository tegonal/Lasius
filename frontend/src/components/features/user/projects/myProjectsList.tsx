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

import { MyProjectsListItemAdministratorContext } from 'components/features/user/projects/myProjectsListItemAdministratorContext'
import { MyProjectsListItemMemberContext } from 'components/features/user/projects/myProjectsListItemMemberContext'
import { Text } from 'components/primitives/typography/Text'
import { AvatarProject } from 'components/ui/data-display/avatar/avatarProject'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { DataFetchEmpty } from 'components/ui/data-display/fetchState/dataFetchEmpty'
import { UserRoles } from 'dynamicTranslationStrings'
import { useProjects } from 'lib/api/hooks/useProjects'
import { stringHash } from 'lib/utils/string/stringHash'
import { useTranslation } from 'next-i18next'
import { ROLES } from 'projectConfig/constants'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

export const MyProjectsList: React.FC = () => {
  const { t } = useTranslation('common')
  const { userProjects } = useProjects()
  const isClient = useIsClient()

  if (!isClient) return null

  if (userProjects().length === 0) {
    return <DataFetchEmpty />
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
            {t('projects.projectRole', { defaultValue: 'Project role' })}
          </DataListHeaderItem>
          <DataListHeaderItem />
        </DataListRow>
        {userProjects().map((item) => (
          <DataListRow key={stringHash(item)}>
            <DataListField width={90}>
              <AvatarProject name={item.projectReference.key} />
            </DataListField>
            <DataListField>
              <Text>{item.projectReference.key}</Text>
            </DataListField>
            <DataListField>
              <Text>{UserRoles[item.role]}</Text>
            </DataListField>
            <DataListField>
              {item.role === ROLES.PROJECT_ADMIN ? (
                <MyProjectsListItemAdministratorContext item={item} />
              ) : (
                <MyProjectsListItemMemberContext item={item} />
              )}
            </DataListField>
          </DataListRow>
        ))}
      </DataList>
    </>
  )
}
