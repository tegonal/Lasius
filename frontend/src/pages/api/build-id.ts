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

import { NextApiRequest, NextApiResponse } from 'next'

export type BuildIdResponse = {
  buildId: string
}

/**
 * Returns the current Lasius version from the LASIUS_VERSION environment variable.
 * Used by clients to detect version skew (when a new version is deployed
 * but the client still has the old bundle loaded).
 */
const handler = (_req: NextApiRequest, res: NextApiResponse): void => {
  const buildId = process.env.LASIUS_VERSION || 'dev'

  res.status(200).json({
    buildId,
  })
}

export default handler
