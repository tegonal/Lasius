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

import { AvatarUser } from '~/components/ui/data-display/avatar-user'
import { TagList } from '~/components/ui/data-display/tag-list'
import { cn } from '~/lib/utils/cn'
import {
  type ModelsCurrentUserTimeBooking,
  type ModelsUserStub,
} from '~/services/api/lasius'

import { BookingName } from '../../bookings/components/booking-name'
import { OrganisationItemContext } from './organisation-item-context'

type Props = {
  item: ModelsCurrentUserTimeBooking
  selectedOrgId: string
  users: ModelsUserStub[]
}

export const OrganisationItem = ({ item, selectedOrgId, users }: Props) => {
  if (!item?.userReference?.id) return null

  const userData = users.find((u) => u.id === item.userReference.id)

  const userKey = item.userReference.key || ''
  const firstName =
    userData?.firstName || userKey.split('.')[0] || userKey[0] || ''
  const lastName =
    userData?.lastName || userKey.split('.')[1] || userKey[1] || ''

  const { booking } = item
  return (
    <div className="border-base-content/20 flex flex-row items-center justify-between gap-2 overflow-hidden border-b py-2 pr-2">
      <div
        className={cn(
          'flex flex-row items-center justify-center gap-2',
          !booking && 'opacity-[0.333] grayscale',
        )}
      >
        <AvatarUser firstName={firstName} lastName={lastName} />
        {booking && (
          <div className="flex flex-col gap-1">
            <BookingName item={booking} variant="compact" />
            <TagList items={booking.tags} width="xs" />
          </div>
        )}
      </div>
      {booking && (
        <div className="flex-shrink-0">
          <OrganisationItemContext item={item} selectedOrgId={selectedOrgId} />
        </div>
      )}
    </div>
  )
}
