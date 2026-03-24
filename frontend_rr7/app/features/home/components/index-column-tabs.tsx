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

import { Clock, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider } from '~/components/primitives/divider'
import {
  IconTabs,
  type IconTabsItem,
} from '~/components/ui/navigation/icon-tabs'
import {
  type ModelsBookingStub,
  type ModelsCurrentUserTimeBooking,
  type ModelsUserStub,
} from '~/services/api/lasius'

import { BookingAddButton } from './booking-add-button'
import { BookingStart } from './booking-start'
import { FavoriteListCompact } from './favorite-list-compact'
import { OrganisationListCompact } from './organisation-list-compact'

type Props = {
  favorites: ModelsBookingStub[]
  orgBookings: ModelsCurrentUserTimeBooking[]
  selectedOrgId: string
  users: ModelsUserStub[]
}

export const IndexColumnTabs = ({
  favorites,
  orgBookings,
  selectedOrgId,
  users,
}: Props) => {
  const { t } = useTranslation('bookings')
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs: IconTabsItem[] = [
    {
      component: (
        <div className="flex w-full flex-col items-center justify-center gap-1 px-2 py-4 sm:gap-4 sm:px-3">
          <BookingStart selectedOrgId={selectedOrgId} />
          <Divider text={t('or', { defaultValue: 'or' })} />
          <BookingAddButton selectedOrgId={selectedOrgId} />
        </div>
      ),
      icon: Clock,
      id: 'bookingStart',
      name: t('actions.start', 'Start booking'),
    },
    {
      component: (
        <FavoriteListCompact
          favorites={favorites}
          selectedOrgId={selectedOrgId}
        />
      ),
      icon: Star,
      id: 'bookingStartFav',
      name: t('actions.startFromFavorite', 'Start booking from favorite'),
    },
    {
      component: (
        <OrganisationListCompact
          orgBookings={orgBookings}
          selectedOrgId={selectedOrgId}
          users={users}
        />
      ),
      icon: Users,
      id: 'bookingStartTeam',
      name: t('actions.startFromTeamMember', 'Start booking from team member'),
    },
  ]

  return (
    <IconTabs onSelect={setSelectedTab} selected={selectedTab} tabs={tabs} />
  )
}
