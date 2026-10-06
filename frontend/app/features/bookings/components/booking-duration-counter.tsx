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

import { TimerIcon } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { formatISOLocale } from '~/lib/utils/dates'
import { durationAsString } from '~/lib/utils/duration'

type Properties = { startDate: string }

const TICK_INTERVAL_MS = 25_000

const subscribeToTicks = (onTick: () => void) => {
  const interval = setInterval(onTick, TICK_INTERVAL_MS)
  return () => clearInterval(interval)
}

// The server and the hydration render show this value, because the server clock differs.
const getServerDuration = () => '00:00'

export const BookingDurationCounter = ({ startDate }: Properties) => {
  const duration = useSyncExternalStore(
    subscribeToTicks,
    () => durationAsString(startDate, formatISOLocale(new Date())),
    getServerDuration,
  )

  return (
    <div className="flex flex-row items-center justify-start gap-1 leading-normal">
      <LucideIcon icon={TimerIcon} size={14} />
      <div>{duration}</div>
    </div>
  )
}
