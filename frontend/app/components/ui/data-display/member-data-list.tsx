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
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarUser } from '~/components/ui/data-display/avatar/avatar-user'
import { Badge } from '~/components/ui/data-display/badge'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { type ModelsUserStub } from '~/services/api/lasius'

type MemberDataListProperties = {
  currentUserId: string | undefined
  renderActions: (user: ModelsUserStub) => ReactNode
  users: ModelsUserStub[]
}

/** Members sorted by last and first name, with a "You" badge and a caller-defined action column. */
export const MemberDataList = ({
  currentUserId,
  renderActions,
  users,
}: MemberDataListProperties) => {
  const { t } = useTranslation('common')

  return (
    <DataList>
      <DataListRow>
        <DataListHeaderItem />
        <DataListHeaderItem>{t('forms.firstName', 'First name')}</DataListHeaderItem>
        <DataListHeaderItem>{t('forms.lastName', 'Last name')}</DataListHeaderItem>
        <DataListHeaderItem>{t('forms.email', 'Email')}</DataListHeaderItem>
        <DataListHeaderItem>{t('status.label', 'Status')}</DataListHeaderItem>
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
              {user.id === currentUserId && <Badge variant="tag">{t('you', 'You')}</Badge>}
            </DataListField>
            <DataListField>{renderActions(user)}</DataListField>
          </DataListRow>
        ),
      )}
    </DataList>
  )
}
