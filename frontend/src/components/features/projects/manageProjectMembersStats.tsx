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

import { Button } from 'components/primitives/buttons/Button'
import { ModalDescription } from 'components/ui/overlays/modal/ModalDescription'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  memberCount: number
  onInvite: () => void
}

export const ManageProjectMembersStats: React.FC<Props> = ({ memberCount, onInvite }) => {
  const { t } = useTranslation('common')

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <ModalDescription>
        {t('members.description', {
          defaultValue: 'This project has {{count}} member(s).',
          count: memberCount,
        })}
      </ModalDescription>
      <Button onClick={onInvite} size="sm" fullWidth={false} className="w-auto" variant="neutral">
        {t('members.actions.invite', { defaultValue: 'Invite someone' })}
      </Button>
    </div>
  )
}
