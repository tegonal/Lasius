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

import { dateOptions } from '~/lib/utils/date/date-options'
import { formatISOLocale } from '~/lib/utils/dates'

/**
 * The date range of a booking list: the `from` and `to` search params when both are set, else the
 * range of the first date option. A loader passes `getUserClock(request)` as `now` and `formatDate`.
 */
export const getListDateRange = (
  searchParameters: URLSearchParams,
  now: Date,
  formatDate: (date: Date) => string = formatISOLocale,
): { from: string; to: string } => {
  const fromParameter = searchParameters.get('from')
  const toParameter = searchParameters.get('to')

  if (fromParameter && toParameter) {
    return { from: fromParameter, to: toParameter }
  }

  const firstOption = dateOptions[0]
  return firstOption
    ? firstOption.dateRangeFn(now, formatDate)
    : { from: formatDate(now), to: formatDate(now) }
}
