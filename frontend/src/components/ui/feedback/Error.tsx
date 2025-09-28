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

import { PageError } from 'dynamicTranslationStrings'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import React, { useEffect } from 'react'

export const Error: React.FC<{ statusCode: number }> = ({ statusCode }) => {
  const plausible = usePlausible<LasiusPlausibleEvents>()

  useEffect(() => {
    plausible('error', {
      props: {
        status: statusCode.toString(),
        message: PageError[statusCode.toString()],
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-[66vh] items-center justify-center">
      <div className="border-base-200 border-r p-3">
        <h1 className="m-0 border-none p-0 text-4xl font-bold">{statusCode}</h1>
      </div>
      <div className="p-3">
        <p>{PageError[statusCode.toString() || 'undefined']}</p>
      </div>
    </div>
  )
}
