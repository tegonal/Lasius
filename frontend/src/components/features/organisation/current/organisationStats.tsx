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

import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetOrganisationUserList } from 'lib/api/lasius/organisations/organisations'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { ROLES } from 'projectConfig/constants'
import React from 'react'

type Props = {
  onInvite: () => void
  onEdit: () => void
  onCreate: () => void
}

export const OrganisationStats: React.FC<Props> = ({ onInvite, onEdit, onCreate }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisation } = useOrganisation()
  const { data: userList } = useGetOrganisationUserList(
    selectedOrganisation?.organisationReference.id || '',
  )

  const memberCount = userList?.length || 0

  const organisationName = selectedOrganisation?.private
    ? t('organisations.myPersonalOrganisation', {
        defaultValue: 'My personal organisation',
      })
    : selectedOrganisation?.organisationReference.key || ''

  const isAdmin = selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN
  const isPrivate = selectedOrganisation?.private

  return (
    <div className="bg-base-200 flex items-start justify-between gap-4 p-4">
      <StatsGroup>
        <div className="stat h-fit">
          <div className="stat-title">
            {t('organisations.organisationName', { defaultValue: 'Organisation' })}
          </div>
          <div className="stat-value text-2xl">{organisationName}</div>
        </div>
        <StatsTileNumber
          value={memberCount}
          label={t('organisations.members', { defaultValue: 'Members' })}
          standalone={false}
        />
      </StatsGroup>
      <div className="dropdown dropdown-end">
        <button type="button" className="btn btn-sm btn-neutral w-auto" tabIndex={0}>
          {t('common.actions.actions', { defaultValue: 'Actions' })}
          <ChevronDown className="size-4" />
        </button>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
          {isAdmin && !isPrivate && (
            <>
              <li>
                <button onClick={onInvite}>
                  {t('members.actions.invite', { defaultValue: 'Invite someone' })}
                </button>
              </li>
              <li>
                <button onClick={onEdit}>
                  {t('organisations.actions.edit', { defaultValue: 'Edit organisation' })}
                </button>
              </li>
            </>
          )}
          <li>
            <button onClick={onCreate}>
              {t('organisations.actions.create', { defaultValue: 'Create organisation' })}
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
