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

import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'

type Props = {
  memberCount: number
  onAddExisting: () => void
  onInvite: () => void
}

export const ManageProjectMembersStats = ({
  memberCount,
  onAddExisting,
  onInvite,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <ModalDescription>
        {t(
          'organisation:members.description',
          'This project has {{count}} member(s).',
          {
            count: memberCount,
          },
        )}
      </ModalDescription>
      <div className="dropdown dropdown-end">
        <button
          className="btn btn-sm btn-neutral w-auto"
          data-testid="project-members-actions-dropdown"
          tabIndex={0}
          type="button"
        >
          {t('organisation:members.actions.addMember', 'Add member')}
          <ChevronDown className="size-4" />
        </button>
        <ul
          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          tabIndex={0}
        >
          <li>
            <button
              data-testid="project-members-add-existing-btn"
              onClick={onAddExisting}
            >
              {t(
                'organisation:members.actions.addFromOrganisation',
                'Add from organisation',
              )}
            </button>
          </li>
          <li>
            <button data-testid="project-members-invite-btn" onClick={onInvite}>
              {t(
                'organisation:members.actions.inviteByEmail',
                'Invite by email',
              )}
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
