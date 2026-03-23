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

/**
 * Returns true if the two times are within one minute of each other.
 */
export const areTimesWithinOneMinute = (
  time1: Date | string,
  time2: Date | string,
): boolean => {
  const d1 = typeof time1 === 'string' ? new Date(time1) : time1
  const d2 = typeof time2 === 'string' ? new Date(time2) : time2
  return Math.abs(d1.getTime() - d2.getTime()) <= 60_000
}
