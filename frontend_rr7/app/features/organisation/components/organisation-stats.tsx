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

import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { StatsTileNumber } from '~/features/stats/components/stats-tile-number'

type Props = {
  memberCount: number
  onCreate: () => void
  onEdit: () => void
  onInvite: () => void
}

export const OrganisationStats = ({
  memberCount,
  onCreate,
  onEdit,
  onInvite,
}: Props) => {
  const { t } = useTranslation('common')
  const { isAdministrator, selectedOrganisation } = useOrganisation()

  const organisationName = selectedOrganisation?.private
    ? t('organisations.myPersonalOrganisation', {
        defaultValue: 'My personal organisation',
      })
    : selectedOrganisation?.organisationReference.key || ''

  const isPrivate = selectedOrganisation?.private

  return (
    <div className="bg-base-200 flex items-start justify-between gap-4 p-4">
      <div className="stats shadow">
        <div className="stat h-fit">
          <div className="stat-title">
            {t('organisations.organisationName', {
              defaultValue: 'Organisation',
            })}
          </div>
          <div className="stat-value text-2xl">{organisationName}</div>
        </div>
        <StatsTileNumber
          label={t('organisations.members', {
            defaultValue: 'Members',
          })}
          standalone={false}
          value={memberCount}
        />
      </div>
      <div className="dropdown dropdown-end">
        <button
          className="btn btn-sm btn-neutral w-auto"
          data-testid="org-actions-dropdown"
          tabIndex={0}
          type="button"
        >
          {t('common.actions.actions', { defaultValue: 'Actions' })}
          <ChevronDown className="size-4" />
        </button>
        <ul
          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          tabIndex={0}
        >
          {isAdministrator && !isPrivate && (
            <>
              <li>
                <button data-testid="org-actions-invite-btn" onClick={onInvite}>
                  {t('members.actions.invite', {
                    defaultValue: 'Invite someone',
                  })}
                </button>
              </li>
              <li>
                <button data-testid="org-actions-edit-btn" onClick={onEdit}>
                  {t('organisations.actions.edit', {
                    defaultValue: 'Edit organisation',
                  })}
                </button>
              </li>
            </>
          )}
          <li>
            <button data-testid="org-actions-create-btn" onClick={onCreate}>
              {t('organisations.actions.create', {
                defaultValue: 'Create organisation',
              })}
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
