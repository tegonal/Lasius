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
import { Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarUser } from '~/components/ui/data-display/avatar/avatar-user'
import { Badge } from '~/components/ui/data-display/badge'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { EmptyState } from '~/components/ui/data-display/empty-state'
import { OrganisationMemberActions } from '~/features/organisation/components/organisation-member-actions'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { type ModelsUserStub } from '~/services/api/lasius'

type Props = {
  isAdmin: boolean
  onRefresh: () => void
  orgId: string
  users: ModelsUserStub[]
}

export const OrganisationMembers = ({
  isAdmin,
  onRefresh,
  orgId,
  users,
}: Props) => {
  const { t } = useTranslation('common')
  const layoutData = useLayoutLoaderData()
  const userId = layoutData?.user.id ?? ''
  const [removingUserId, setRemovingUserId] = useState<null | string>(null)

  if (!users || users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        label={t('members.emptyState', {
          defaultValue: 'No members found',
        })}
      />
    )
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
            {isAdmin && user.id !== userId && (
              <OrganisationMemberActions
                isRemoving={removingUserId === user.id}
                onRemove={() => setRemovingUserId(user.id)}
                onRemoveCancel={() => setRemovingUserId(null)}
                onRemoveComplete={() => {
                  setRemovingUserId(null)
                  onRefresh()
                }}
                orgId={orgId}
                user={user}
              />
            )}
          </DataListField>
        </DataListRow>
      ))}
    </DataList>
  )
}
