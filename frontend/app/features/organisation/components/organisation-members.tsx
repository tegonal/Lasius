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

import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '~/components/ui/data-display/empty-state'
import { MemberDataList } from '~/components/ui/data-display/member-data-list'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { OrganisationMemberActions } from '~/features/organisation/components/organisation-member-actions'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { type ModelsUserStub } from '~/services/api/lasius'

type Properties = {
  isAdmin: boolean
  onRefresh: () => void
  orgId: string
  users: ModelsUserStub[]
}

export const OrganisationMembers = ({ isAdmin, onRefresh, orgId, users }: Properties) => {
  const { t } = useTranslation('organisation')
  const layoutData = useLayoutLoaderData()
  if (!users || users.length === 0) {
    return <EmptyState icon={Users} label={t('members.emptyState', 'No members found')} />
  }

  const userId = layoutData?.user.id ?? ''

  return (
    <ContextMenuProvider>
      <MemberDataList
        currentUserId={userId}
        renderActions={(user) =>
          isAdmin &&
          user.id !== userId && (
            <OrganisationMemberActions onRemoveComplete={onRefresh} orgId={orgId} user={user} />
          )
        }
        users={users}
      />
    </ContextMenuProvider>
  )
}
