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
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { IconTabs, IconTabsItem } from 'components/ui/navigation/IconTabs'
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
          <FormElementSpacer />
          <BookingAddButton />
        </div>
      ),
      icon: 'stopwatch-interface-essential',
    },
    {
      id: 'bookingStartFav',
      name: t('bookings.actions.startFromFavorite', {
        defaultValue: 'Start booking from favorite',
      }),
      component: <FavoriteListCompact />,
      icon: 'rating-star-social-medias-rewards-rating',
    },
    {
      id: 'bookingStartTeam',
      name: t('bookings.actions.startFromTeamMember', {
        defaultValue: 'Start booking from team member',
      }),
      component: <OrganisationListCompact />,
      icon: 'human-resources-search-team-work-office-companies',
    },
  ]

  return <IconTabs tabs={tabs} />
}
