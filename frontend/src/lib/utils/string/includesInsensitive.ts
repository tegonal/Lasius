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
 * Checks if a string contains a substring, case-insensitively.
 *
 * @param string - The string to search in
 * @param cmpString - The substring to search for
 * @returns True if the substring is found (case-insensitive), false otherwise
 *
 * @example
 * includesInsensitive('Hello World', 'world') // true
 * includesInsensitive('Hello World', 'HELLO') // true
 * includesInsensitive('Hello World', 'xyz') // false
 */
export const includesInsensitive = (string: string, cmpString: string): boolean => {
  return string.toLowerCase().indexOf(cmpString.toLowerCase()) !== -1
}
