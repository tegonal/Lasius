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

import { BookingAddButton } from 'components/features/user/index/bookingAddButton'
import { BookingStart } from 'components/features/user/index/bookingStart'
import { FavoriteListCompact } from 'components/features/user/index/favorites/favoriteListCompact'
import { OrganisationListCompact } from 'components/features/user/index/organisation/organisationListCompact'
import { Divider } from 'components/primitives/divider'
import { IconTabs, IconTabsItem } from 'components/ui/navigation/IconTabs'
import { Clock, Star, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const IndexColumnTabs: React.FC = () => {
  const { t } = useTranslation('common')

  const tabs: IconTabsItem[] = [
    {
      id: 'bookingStart',
      name: t('bookings.actions.start', { defaultValue: 'Start booking' }),
      component: (
        <div className="flex w-full flex-col items-center justify-center gap-1 px-2 py-4 sm:gap-4 sm:px-3">
          <BookingStart />
          <Divider text={t('common.or', { defaultValue: 'or' })} />
          <BookingAddButton />
        </div>
      ),
      icon: Clock,
    },
    {
      id: 'bookingStartFav',
      name: t('bookings.actions.startFromFavorite', {
        defaultValue: 'Start booking from favorite',
      }),
      component: <FavoriteListCompact />,
      icon: Star,
    },
    {
      id: 'bookingStartTeam',
      name: t('bookings.actions.startFromTeamMember', {
        defaultValue: 'Start booking from team member',
      }),
      component: <OrganisationListCompact />,
      icon: Users,
    },
  ]

  return <IconTabs tabs={tabs} />
}
