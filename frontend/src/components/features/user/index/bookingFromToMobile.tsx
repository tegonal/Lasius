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

import { Text } from 'components/primitives/typography/Text'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ModelsBooking } from 'lib/api/lasius'
import { ArrowLeftRight } from 'lucide-react'
import React from 'react'

type Props = {
  item: ModelsBooking
}

export const BookingFromToMobile: React.FC<Props> = ({ item }) => {
  const { start, end } = item
  return (
    <div className="flex flex-row gap-1 leading-normal">
      <div className="flex items-center justify-center">
        <Text variant="small">
          <FormatDate date={start.dateTime} format="time" />
        </Text>
      </div>
      <div className="flex items-center justify-center">
        <Text variant="small">
          <LucideIcon icon={ArrowLeftRight} size={16} />
        </Text>
      </div>
      <div className="flex items-center justify-center">
        <Text variant="small">
          <FormatDate date={end?.dateTime || ''} format="time" />
        </Text>
      </div>
    </div>
  )
}
