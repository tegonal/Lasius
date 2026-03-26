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

import { type ShouldRevalidateFunctionArgs } from 'react-router'

import { cachedServerLoader } from '~/lib/utils/loader-cache'

/**
 * Only revalidate when date range search params (from/to/dateRange) change.
 * Shared across all stats layout and child routes.
 * Client-safe — must NOT be in a .server.ts file.
 */
export const statsShouldRevalidate = ({
  currentUrl,
  defaultShouldRevalidate,
  formMethod,
  nextUrl,
}: ShouldRevalidateFunctionArgs) => {
  if (formMethod) return defaultShouldRevalidate
  const currentFrom = currentUrl.searchParams.get('from')
  const currentTo = currentUrl.searchParams.get('to')
  const currentDateRange = currentUrl.searchParams.get('dateRange')
  const nextFrom = nextUrl.searchParams.get('from')
  const nextTo = nextUrl.searchParams.get('to')
  const nextDateRange = nextUrl.searchParams.get('dateRange')
  if (
    currentFrom === nextFrom &&
    currentTo === nextTo &&
    currentDateRange === nextDateRange
  ) {
    return false
  }
  return defaultShouldRevalidate
}

/**
 * Shared client loader for all stats child routes.
 * Client-safe — must NOT be in a .server.ts file.
 */
export const statsClientLoader = async <T>({
  request,
  serverLoader,
}: {
  request: Request
  serverLoader: () => Promise<T>
}) => cachedServerLoader(request, serverLoader)
