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

import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { removeAccessibleCookies } from 'lib/utils/auth/removeAccessibleCookies'
import { signOut } from 'next-auth/react'
import { resetAllStores } from 'stores/globalActions'
import { useIsClient } from 'usehooks-ts'

/**
 * Custom hook for handling user sign-out with proper cleanup.
 * Removes cookies, resets all Zustand stores, tracks analytics, and signs out via NextAuth.
 * Only executes on the client side.
 *
 * @returns Object containing:
 *   - signOut: Async function to perform complete sign-out process
 *
 * @example
 * const { signOut } = useSignOut()
 *
 * // Sign out user
 * await signOut()
 *
 * @remarks
 * The sign-out process:
 * 1. Removes all accessible browser cookies (except locale cookie)
 * 2. Resets all Zustand stores to initial state
 * 3. Tracks logout event in analytics
 * 4. Calls NextAuth signOut to invalidate session
 *
 * This ensures complete cleanup of user data from the client.
 */
export const useSignOut = () => {
  const isClient = useIsClient()
  const plausible = usePlausible<LasiusPlausibleEvents>()

  const _signOut = async () => {
    if (isClient) {
      await removeAccessibleCookies()
      resetAllStores()
      plausible('auth.logout.success', {})
      await signOut()
    }
  }

  return { signOut: _signOut }
}
