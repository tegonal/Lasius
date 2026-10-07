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

import { type DateOption } from '~/lib/utils/date/date-options'

export type BookingHistoryDataSource = 'organisationBookings' | 'userBookings'

type FilterDefaults = {
  dateRange: string
  projectId: string
  userId: string
}

type FilterResetValues = FilterDefaults & {
  range: null | { from: string; to: string }
  tags: string
}

type FilterValues = {
  dateRange: string | undefined
  projectId: string | undefined
  tags: string | undefined
  userId: string | undefined
}

/** Returns the default filter values. The date range defaults to the name of the first option. */
export const getFilterDefaults = (firstDateOption: DateOption | undefined): FilterDefaults => ({
  dateRange: firstDateOption?.name ?? '',
  projectId: '',
  userId: '',
})

/** Returns true when any filter value differs from its default, or when a tag is set. */
export const hasFilterChanges = (values: FilterValues, defaults: FilterDefaults): boolean =>
  (values.projectId ?? '') !== defaults.projectId ||
  (values.userId ?? '') !== defaults.userId ||
  !!values.tags ||
  (values.dateRange ?? '') !== defaults.dateRange

/** Returns the values for a filter reset. `range` is null when no date option exists. */
export const getFilterResetValues = (
  firstDateOption: DateOption | undefined,
  now: Date,
): FilterResetValues => ({
  ...getFilterDefaults(firstDateOption),
  range: firstDateOption ? firstDateOption.dateRangeFn(now) : null,
  tags: '',
})

/** Returns the projects page that matches the data source of the booking history. */
export const projectsPathFor = (dataSource: BookingHistoryDataSource): string =>
  dataSource === 'userBookings' ? '/user/projects' : '/organisation/projects'
