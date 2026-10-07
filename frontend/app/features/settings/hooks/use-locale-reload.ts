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

import { useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'

/**
 * Returns the fetcher for the locale cookie and a function that requests a reload.
 * Call the function after the submit. The page reloads when the fetcher is idle again.
 */
export const useLocaleReload = () => {
  const localeFetcher = useFetcher()
  const pendingLocaleReload = useRef(false)

  useEffect(() => {
    if (!(pendingLocaleReload.current && localeFetcher.state === 'idle')) {
      return
    }

    pendingLocaleReload.current = false
    location.reload()
  }, [localeFetcher.state])

  const requestLocaleReload = () => {
    pendingLocaleReload.current = true
  }

  return { localeFetcher, requestLocaleReload }
}
