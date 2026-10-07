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

import { type ModelsTag } from '~/services/api/lasius'

export type FilterUrlValues = {
  from: string
  projectId: string
  tags: string
  to: string
  userId: string
}

const setOrDelete = (parameters: URLSearchParams, key: string, value: string) => {
  if (value) {
    parameters.set(key, value)
  } else {
    parameters.delete(key)
  }
}

/** Writes the filter values into the params. An empty optional value removes its key. */
export const applyFilterParameters = (
  parameters: URLSearchParams,
  values: FilterUrlValues,
): URLSearchParams => {
  parameters.set('from', values.from)
  parameters.set('to', values.to)
  setOrDelete(parameters, 'projectId', values.projectId)
  setOrDelete(parameters, 'userId', values.userId)
  setOrDelete(parameters, 'tags', values.tags)
  return parameters
}

export const areFilterValuesEqual = (a: FilterUrlValues, b: FilterUrlValues): boolean =>
  a.from === b.from &&
  a.to === b.to &&
  a.projectId === b.projectId &&
  a.userId === b.userId &&
  a.tags === b.tags

/** Parses the JSON tag list of the URL. An empty or invalid value gives no tags. */
export const parseTagsParameter = (value: string): ModelsTag[] => {
  if (!value) return []
  try {
    return JSON.parse(value) as ModelsTag[]
  } catch {
    return []
  }
}
