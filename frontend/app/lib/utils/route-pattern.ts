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

import { type Params } from 'react-router'

/**
 * Replaces each dynamic segment of a matched path with its param name, for example
 * `/join/abc` becomes `/join/:invitationId`. A splat value becomes `*`.
 */
export const toRoutePattern = (pathname: string, parameters: Params): string => {
  const { '*': splat, ...named } = parameters
  const nameByValue = new Map<string, string>()
  for (const [name, value] of Object.entries(named)) {
    if (value) nameByValue.set(value, name)
  }

  let pattern = pathname
  if (splat && pattern.endsWith(splat)) {
    pattern = `${pattern.slice(0, -splat.length)}*`
  }

  return pattern
    .split('/')
    .map((segment) => {
      const name = nameByValue.get(safeDecode(segment))
      return name ? `:${name}` : segment
    })
    .join('/')
}

const safeDecode = (segment: string): string => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
