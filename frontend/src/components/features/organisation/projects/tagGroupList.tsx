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

import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { ModelsTag } from 'lib/api/lasius'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  tags: ModelsTag[]
}

export const TagGroupList: React.FC<Props> = ({ tags }) => {
  const { t } = useTranslation('common')

  return (
    <>
      <DataList>
        <DataListRow>
          <DataListHeaderItem>
            {t('organisations.title', { defaultValue: 'Organisations' })}
          </DataListHeaderItem>
          <DataListHeaderItem>
            {t('organisations.title', { defaultValue: 'Organisations' })}
          </DataListHeaderItem>
          <DataListHeaderItem />
        </DataListRow>
        {tags.map((item) => (
          <DataListRow key={item.id}>
            <DataListField>
              <span>{item.id}</span>
            </DataListField>
            <DataListField>
              <span>{item.type}</span>
            </DataListField>
            <DataListField>{/* <ProjectsListItemContext item={item} /> */}</DataListField>
          </DataListRow>
        ))}
      </DataList>
    </>
  )
}
