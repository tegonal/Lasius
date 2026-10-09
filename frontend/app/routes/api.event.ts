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

import { z } from 'zod'

import { getTrustedClientIp } from '~/lib/client-ip.server'
import { logger } from '~/lib/logger'
import { getPlausibleConfig } from '~/lib/plausible-config.server'

import { type Route } from './+types/api.event.ts'

const PLAUSIBLE_TIMEOUT_MS = 5000

const pageViewSchema = z.object({
  path: z.string().startsWith('/').max(512),
  referrer: z.string().max(2048).optional(),
})

/**
 * POST /api/event
 *
 * Forwards a page view to Plausible. The body holds the route pattern of the page, never the real
 * path, so IDs stay out of the statistics. Analytics must never break the app, so a failure of
 * Plausible answers 202 and only logs. A missing config answers 204, and a malformed body 400.
 */
export async function action({ request }: Route.ActionArgs) {
  const config = getPlausibleConfig()
  if (!config) {
    return new Response(null, { status: 204 })
  }
  const { domain, host } = config

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  const parsed = pageViewSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(null, { status: 400 })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': request.headers.get('user-agent') ?? '',
  }
  // The Caddy in front of Plausible replaces X-Forwarded-For with the IP of this server.
  // Plausible reads X-Plausible-IP first, and Caddy passes it on unchanged.
  const clientIp = getTrustedClientIp(request)
  if (clientIp) headers['X-Plausible-IP'] = clientIp

  try {
    const response = await fetch(new URL('/api/event', host), {
      body: JSON.stringify({
        domain,
        name: 'pageview',
        referrer: parsed.data.referrer ?? '',
        url: `https://${domain}${parsed.data.path}`,
      }),
      headers,
      method: 'POST',
      signal: AbortSignal.timeout(PLAUSIBLE_TIMEOUT_MS),
    })
    if (!response.ok) {
      logger.warn({ status: response.status }, 'Plausible rejected a page view')
    }
  } catch (error) {
    logger.warn('Failed to send a page view to Plausible', error)
  }

  return new Response(null, { status: 202 })
}
