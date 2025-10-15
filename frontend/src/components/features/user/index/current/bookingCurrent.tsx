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

import { BookingCurrentEntry } from 'components/features/user/index/current/bookingCurrentEntry'
import React from 'react'

type Props = {
  inContainer?: boolean
}

export const BookingCurrent: React.FC<Props> = ({ inContainer = true }) => {
  return (
    <div className="bg-base-200 relative flex h-full min-h-[96px] w-full flex-row items-center gap-3 overflow-hidden px-2 py-3 sm:px-3 md:bg-transparent lg:px-4 [&>*]:w-full">
      <BookingCurrentEntry inContainer={inContainer} />
    </div>
  )
}
