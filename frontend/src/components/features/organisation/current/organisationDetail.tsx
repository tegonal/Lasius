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

import { OrganisationMembers } from 'components/features/organisation/current/organisationMembers'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { Lock } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

export const OrganisationDetail: React.FC = () => {
  const { t } = useTranslation('common')
  const { selectedOrganisation } = useOrganisation()
  const isClient = useIsClient()

  if (!isClient) return null

  return (
    <div className="flex flex-col gap-8">
      {selectedOrganisation?.private && (
        <div className="mx-auto mb-4 flex max-w-[500px] flex-col items-center justify-center gap-3 text-center">
          <LucideIcon icon={Lock} size={24} />
          <div className="w-full max-w-[500px]">
            {t('organisations.privateDescription', {
              defaultValue:
                'This organisation is only visible to you. You can use it to track private projects that you do not want others to have access to. If you want to invite people, invite them to an existing organisation or create a new one.',
            })}
          </div>
        </div>
      )}
      {!selectedOrganisation?.private && <OrganisationMembers item={selectedOrganisation} />}
    </div>
  )
}
