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
import { Icon } from 'components/ui/icons/Icon'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { AUTH_PROVIDER_INTERNAL_LASIUS } from 'projectConfig/constants'
import { getNavigation, NavigationRouteType } from 'projectConfig/routes'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

const NavigationButton: React.FC<{ item: NavigationRouteType }> = ({ item }) => {
  const router = useRouter()
  const { t } = useTranslation('common')
  const isClient = useIsClient()

  if (!isClient) return null

  return (
    <Button
      key={item.name}
      variant={router.route === item.route ? 'navigationActive' : 'navigation'}
      onClick={() => router.push(item.route)}
      fullWidth>
      <Icon name={item.icon} size={24} />
      <div>{t(item.name as any)}</div>
    </Button>
  )
}

type Props = {
  branch: string
}

export const NavigationTabContent: React.FC<Props> = ({ branch }) => {
  const { isAdministrator } = useOrganisation()
  const session = useSession()

  return (
    <div className="flex flex-col items-start justify-start gap-3">
      {getNavigation({
        id: branch,
        isOrganisationAdministrator: isAdministrator,
        isUserOfInternalOAuthProvider: session.data?.provider === AUTH_PROVIDER_INTERNAL_LASIUS,
      }).map((item) => (
        <NavigationButton key={item.name} item={item} />
      ))}
    </div>
  )
}
