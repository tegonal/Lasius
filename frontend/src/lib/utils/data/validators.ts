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
 * Regular expression pattern for basic email address validation.
 * Checks for the presence of '@' symbol and domain with at least one dot.
 */
export const emailValidationPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates whether a string is a properly formatted email address.
 * Uses a basic regex pattern that checks for:
 * - Characters before @
 * - @ symbol
 * - Domain name with at least one dot
 * - No whitespace
 *
 * @param string - The string to validate
 * @returns True if the string matches email format, false otherwise
 *
 * @example
 * isEmailAddress('user@example.com') // true
 * isEmailAddress('invalid.email') // false
 * isEmailAddress('test@domain') // false (no TLD)
 */
export const isEmailAddress = (string: string): boolean => emailValidationPattern.test(string)
