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

import { type ModelsWorkingHours } from '~/services/api/lasius'
import { type ModelsWorkingHoursWeekdays } from '~/types/common'

const WEEKDAYS: ModelsWorkingHoursWeekdays[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

/** True when the planned working hours of the week add up to more than zero. */
export const hasPlannedWorkingHours = (hours: ModelsWorkingHours | null | undefined): boolean =>
  WEEKDAYS.reduce((total, day) => total + (hours?.[day] || 0), 0) > 0
