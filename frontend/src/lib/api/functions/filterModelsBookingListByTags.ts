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

import { difference } from 'es-toolkit'
import { ModelsBooking } from 'lib/api/lasius'
import { cleanStrForCmp } from 'lib/utils/string/strings'
import { ModelsTags } from 'types/common'

export const filterModelsBookingListByTags = (list: ModelsBooking[], tags: ModelsTags[]) =>
  list.filter((booking) => {
    const arrFilter = tags.map((item) => cleanStrForCmp(item.id))
    const arrBooking = booking.tags.map((item) => cleanStrForCmp(item.id))
    // Check if all elements in arrFilter exist in arrBooking
    return difference(arrFilter, arrBooking).length === 0
  })
