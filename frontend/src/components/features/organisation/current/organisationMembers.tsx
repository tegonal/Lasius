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

import { UserCard } from 'components/features/user/manageUserCard'
import { Heading } from 'components/primitives/typography/Heading'
import { isAdminOfCurrentOrg } from 'lib/api/functions/isAdminOfCurrentOrg'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import {
  removeOrganisationUser,
  useGetOrganisationUserList,
} from 'lib/api/lasius/organisations/organisations'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  item: ModelsUserOrganisation | undefined
}

export const OrganisationMembers: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const { data: userList } = useGetOrganisationUserList(item?.organisationReference.id || '')
  const { profile } = useProfile()
  const amIAdmin = isAdminOfCurrentOrg(profile)

  const handleUserRemove = (userId: string) => {
    ;(async () => {
      if (item) {
        await removeOrganisationUser(item.organisationReference.id, userId)
      }
    })()
  }

  return (
    <div className="w-full">
      <Heading as="h2" variant="headingUnderlinedMuted">
        <div className="flex items-center gap-2">
          <span>{t('members.title', { defaultValue: 'Members' })}</span>
          <span className="text-sm font-normal">({userList?.length})</span>
        </div>
      </Heading>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {userList?.map((user) => (
          <UserCard
            canRemove={amIAdmin}
            user={user}
            key={user.id}
            onRemove={() => handleUserRemove(user.id)}
          />
        ))}
      </div>
    </div>
  )
}
