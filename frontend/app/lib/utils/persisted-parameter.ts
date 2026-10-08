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

type StoredParameter = { fallback: string; value: string }

/** Serializes a value together with the fallback that applied when the user chose it. */
export const serializePersistedParameter = (value: string, fallback: string): string =>
  JSON.stringify({ fallback, value } satisfies StoredParameter)

/**
 * Returns the entry to store for the value, or null when the stored entry already holds it. A
 * reload or a new day then keeps the fallback of the day the user chose the value.
 */
export const nextPersistedParameter = (
  raw: null | string,
  value: string,
  fallback: string,
): null | string => {
  try {
    if (raw && (JSON.parse(raw) as Partial<StoredParameter>).value === value) return null
  } catch {
    // A value of the earlier plain-string format gets a new entry.
  }
  return serializePersistedParameter(value, fallback)
}

/**
 * Returns the stored value while the fallback is unchanged, else null. For the `date` param the
 * fallback is today, so a selection lasts until the next day.
 */
export const readPersistedParameter = (raw: null | string, fallback: string): null | string => {
  if (!raw) return null
  try {
    const stored = JSON.parse(raw) as Partial<StoredParameter>
    return stored.fallback === fallback && typeof stored.value === 'string' && stored.value
      ? stored.value
      : null
  } catch {
    // A value from the earlier plain-string format has no fallback, so it counts as stale.
    return null
  }
}
