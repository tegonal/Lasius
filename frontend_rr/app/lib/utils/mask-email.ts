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
 * Mask an email address for display: `test@example.com` → `t***@example.com`.
 * Preserves the first character of the local part and the full domain.
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex < 1) return '***'
  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)
  if (!domain) return '***'
  return `${local[0]}***@${domain}`
}
