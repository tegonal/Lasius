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
import { useLocation, useMatches } from 'react-router'

import { logger } from '~/lib/logger'
import { toRoutePattern } from '~/lib/utils/route-pattern'

/**
 * Sends a page view to `/api/event` after each change of the path. The body holds the route
 * pattern, so invitation and project IDs never reach Plausible. Without a Plausible config, the
 * hook sends nothing.
 */
export const usePageViewTracking = (isEnabled: boolean) => {
  const { pathname } = useLocation()
  const leaf = useMatches().at(-1)
  const path = leaf ? toRoutePattern(leaf.pathname, leaf.params) : '/'

  useEffect(() => {
    if (!isEnabled) return
    const send = async () => {
      try {
        await fetch('/api/event', {
          body: JSON.stringify({ path, referrer: document.referrer }),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          method: 'POST',
        })
      } catch (error) {
        logger.warn('Failed to send a page view', error)
      }
    }
    void send()
  }, [isEnabled, pathname, path])
}
