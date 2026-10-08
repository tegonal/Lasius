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

import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

import { nextPersistedParameter, readPersistedParameter } from '~/lib/utils/persisted-parameter'

const STORAGE_PREFIX = 'lasius:'

/**
 * Syncs a URL search param to localStorage.
 *
 * - On mount: if the search param is missing, restores it from localStorage. The stored value
 *   counts only while the fallback is unchanged, so a date selection lasts until the next day.
 * - On change: persists the search param value to localStorage.
 *
 * @param key - The search param name (also used as localStorage key with prefix)
 * @param fallback - Default value when neither URL nor localStorage has the param
 * @returns The current value of the search param
 */
export const usePersistedSearchParameter = (key: string, fallback: string): string => {
  const [searchParameters, setSearchParameters] = useSearchParams()
  const parameterValue = searchParameters.get(key)
  const storageKey = `${STORAGE_PREFIX}${key}`

  // On mount: restore from localStorage if URL doesn't have the param
  useEffect(() => {
    if (parameterValue) return

    const raw = globalThis.window === undefined ? null : localStorage.getItem(storageKey)
    const valueToSet = readPersistedParameter(raw, fallback) ?? fallback

    setSearchParameters(
      (previous) => {
        previous.set(key, valueToSet)
        return previous
      },
      { preventScrollReset: true, replace: true },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once on mount

  // On change: persist to localStorage. An unchanged value keeps its stored fallback.
  useEffect(() => {
    if (!parameterValue || globalThis.window === undefined) return
    const next = nextPersistedParameter(localStorage.getItem(storageKey), parameterValue, fallback)
    if (next) localStorage.setItem(storageKey, next)
  }, [fallback, parameterValue, storageKey])

  return parameterValue || fallback
}
