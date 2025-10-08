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

import { logger } from 'lib/logger'
import { LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN } from 'projectConfig/constants'
import { useCallback } from 'react'

type PlausibleOptions = {
  readonly callback?: () => void
  readonly props?: Record<string, unknown>
  readonly revenue?: { currency: string; amount: number | string }
}

type PlausibleEvent = {
  readonly n: string // Event name
  readonly u: string // Page URL
  readonly d: string // Domain
  readonly r: string | null // Referrer
  readonly w: number // Screen width
  readonly h: 0 | 1 // Hash mode
  readonly p?: string // Props (stringified JSON)
}

/**
 * Custom usePlausible hook that sends events to our local API endpoint
 * which forwards them to the self-hosted Plausible instance
 */
export function usePlausible<T extends Record<string, PlausibleOptions> = any>() {
  return useCallback((eventName: Extract<keyof T, string>, options?: PlausibleOptions) => {
    // Only track if domain is configured
    if (!LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN) {
      logger.debug('[Plausible] Tracking disabled: no domain configured')
      return
    }

    try {
      // Build the event payload matching Plausible's API format
      const event: Omit<PlausibleEvent, 'p'> = {
        n: eventName,
        u: window.location.href,
        d: LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN,
        r: document.referrer || null,
        w: window.innerWidth,
        h: window.location.hash ? 1 : 0,
      }

      // Add props if provided
      let fullEvent: PlausibleEvent
      if (options?.props || options?.revenue) {
        const props: Record<string, unknown> = {}
        if (options.props) {
          Object.assign(props, options.props)
        }
        if (options.revenue) {
          props.revenue = options.revenue
        }
        fullEvent = { ...event, p: JSON.stringify(props) }
      } else {
        fullEvent = event as PlausibleEvent
      }

      // Send to our local API endpoint
      fetch('/api/plausible/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Browser will automatically add User-Agent
          // X-Forwarded-For will be handled by the API route
        },
        body: JSON.stringify(fullEvent),
      })
        .then((response) => {
          if (!response.ok) {
            logger.warn(`[Plausible] Event failed: ${response.status}`)
          }
          // Call the callback if provided
          if (options?.callback) {
            options.callback()
          }
        })
        .catch((error) => {
          logger.error('[Plausible] Failed to send event:', error)
        })
    } catch (error) {
      logger.error('[Plausible] Error preparing event:', error)
    }
  }, [])
}

/**
 * Hook to track outbound link clicks
 * This is a specialized version for external links
 */
export function usePlausibleOutboundLinkClick() {
  const plausible = usePlausible()

  return useCallback(
    (url: string) => {
      plausible('Outbound Link: Click', {
        props: { url },
      })
    },
    [plausible],
  )
}
