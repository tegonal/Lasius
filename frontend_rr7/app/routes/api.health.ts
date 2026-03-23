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

import { data } from 'react-router'

import { getConfiguration } from '~/services/api/lasius/general/general'

export type HealthResponse = {
  backend: 'connected' | 'disconnected'
  status: 'ok'
  version: string
}

/**
 * GET /api/health
 *
 * Returns app self-status, backend connectivity, and build version.
 * No auth required — must work even when session is expired.
 */
export async function loader() {
  const version = process.env.LASIUS_VERSION || 'dev'

  let backend: HealthResponse['backend'] = 'disconnected'
  try {
    await getConfiguration()
    backend = 'connected'
  } catch {
    backend = 'disconnected'
  }

  return data({ backend, status: 'ok', version } satisfies HealthResponse, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
