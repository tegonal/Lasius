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

import { BookingName } from 'components/features/user/index/bookingName'
import { FavoriteItemContext } from 'components/features/user/index/favorites/favoriteItemContext'
import { TagList } from 'components/ui/data-display/TagList'
import { ModelsBookingStub } from 'lib/api/lasius'
import React from 'react'

type Props = {
  item: ModelsBookingStub
}

export const FavoriteItem: React.FC<Props> = ({ item }) => {
  return (
    <div className="border-base-content/20 flex flex-row items-center justify-between gap-2 border-b px-2 py-2">
      <div className="flex flex-col gap-1">
        <BookingName item={item} />
        <TagList items={item.tags} />
      </div>
      <div className="flex-shrink-0">
        <FavoriteItemContext item={item} />
      </div>
    </div>
  )
}
