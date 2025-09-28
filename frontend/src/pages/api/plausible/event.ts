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
import { NextApiRequest, NextApiResponse } from 'next'
import { LASIUS_TELEMETRY_PLAUSIBLE_HOST } from 'projectConfig/constants'

export type PlausibleEventPayload = {
  /** Event name */
  readonly n: string
  /** Page URL */
  readonly u: string
  /** Domain */
  readonly d: string
  /** Referrer */
  readonly r: string | null
  /** Screen width */
  readonly w: number
  /** Hash mode */
  readonly h: 1 | 0
  /** Props, stringified JSON */
  readonly p?: string
}

/**
 * Get the client's real IP address from various headers
 * Handles proxies, load balancers, and CDNs
 */
function getClientIp(req: NextApiRequest): string {
  // Check headers in order of preference
  const forwardedFor = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const cfConnectingIp = req.headers['cf-connecting-ip']

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
    return ips.split(',')[0].trim()
  }

  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp
  }

  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp
  }

  // Fall back to socket address
  return req.socket.remoteAddress || '127.0.0.1'
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate Plausible host is configured
  if (!LASIUS_TELEMETRY_PLAUSIBLE_HOST) {
    console.error('❌ LASIUS_TELEMETRY_PLAUSIBLE_HOST not configured')
    return res.status(500).json({ error: 'Plausible host not configured' })
  }

  try {
    const body = req.body as PlausibleEventPayload
    const clientIp = getClientIp(req)
    const debugMode = req.headers['x-debug-request'] === 'true'

    console.log('📊 Plausible event received:', {
      event: body.n,
      url: body.u,
      domain: body.d,
      props: body.p ? JSON.parse(body.p) : undefined,
      clientIp: debugMode ? clientIp : 'hidden',
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    })

    // Build headers for forwarding to Plausible
    // Note: Plausible accepts both application/json and text/plain
    const headers: HeadersInit = {
      'Content-Type': 'text/plain',
      // User-Agent is critical for device detection
      'User-Agent': req.headers['user-agent'] || 'Unknown',
      // X-Forwarded-For is critical for unique visitor counting
      'X-Forwarded-For': clientIp,
    }

    // Add debug header if requested
    if (debugMode) {
      headers['X-Debug-Request'] = 'true'
    }

    // Ensure referrer is included (use the one from the event or fallback to header)
    const eventBody = {
      ...body,
      r: body.r || req.headers.referer || null,
    }

    // Construct Plausible URL (handle both http/https and missing protocol)
    const plausibleUrl = LASIUS_TELEMETRY_PLAUSIBLE_HOST.startsWith('http')
      ? `${LASIUS_TELEMETRY_PLAUSIBLE_HOST}/api/event`
      : `https://${LASIUS_TELEMETRY_PLAUSIBLE_HOST}/api/event`

    console.log('📤 Forwarding to Plausible:', {
      url: plausibleUrl,
      ip: debugMode ? clientIp : 'hidden',
    })

    // Forward the request to Plausible
    const response = await fetch(plausibleUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventBody),
    })

    const responseText = await response.text()

    if (response.ok) {
      console.log('✅ Plausible response:', response.status, debugMode ? responseText : '')

      // Return the response from Plausible
      if (responseText) {
        try {
          const jsonResponse = JSON.parse(responseText)
          return res.status(response.status).json(jsonResponse)
        } catch {
          // Not JSON, return as text
          return res.status(response.status).send(responseText)
        }
      } else {
        return res.status(response.status).end()
      }
    } else {
      console.error('❌ Plausible error response:', response.status, responseText)
      logger.error('Plausible API error', {
        status: response.status,
        response: responseText,
        url: plausibleUrl,
      })
      return res.status(response.status).json({
        error: 'Plausible API error',
        details: responseText,
      })
    }
  } catch (error) {
    console.error('❌ Error forwarding to Plausible:', error)
    logger.error('Error forwarding event to Plausible', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export default handler
