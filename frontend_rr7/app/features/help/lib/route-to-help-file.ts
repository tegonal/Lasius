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
 * Maps RR7 route pathnames to help file names.
 *
 * Help files were authored for the Next.js route structure (e.g. /user/home → user-home).
 * RR7 uses a flatter route structure, so we need an explicit mapping.
 */
/**
 * Maps route prefixes to their help file. Checked in order — first match wins.
 * This handles sub-routes that should share a parent's help file.
 */
const prefixMap: Array<[prefix: string, helpFile: string]> = [
  ['/user/dashboard', 'user-dashboard'],
  ['/user/stats', 'user-stats'],
  ['/organisation/stats', 'organisation-stats'],
]

const routeMap: Record<string, string> = {
  '/': 'user-home',
  '/dashboard': 'user-dashboard',
  '/login': 'login',
}

export const routeToHelpFile = (path: string): string => {
  // Check explicit mapping first
  const mapped = routeMap[path]
  if (mapped) {
    return mapped
  }

  // Check prefix-based mapping (sub-routes sharing a parent help file)
  const prefix = prefixMap.find(([p]) => path.startsWith(p))
  if (prefix) {
    return prefix[1]
  }

  // Fallback: convert path to hyphenated name
  let normalized = path.replace(/^\//, '').replaceAll('/', '-')

  if (normalized === '') {
    return 'user-home'
  }

  // Handle dynamic route segments (React Router uses :param syntax)
  normalized = normalized.replaceAll(/:[^-/]+/g, 'dynamic')

  return normalized
}
