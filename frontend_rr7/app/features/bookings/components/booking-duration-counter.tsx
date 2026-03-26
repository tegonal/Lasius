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
import { useEffect, useState } from 'react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { formatISOLocale } from '~/lib/utils/dates'
import { durationAsString } from '~/lib/utils/duration'

type Props = { startDate: string }

export const BookingDurationCounter = ({ startDate }: Props) => {
  const [duration, setDuration] = useState<string>('00:00')

  useEffect(() => {
    setDuration(durationAsString(startDate, formatISOLocale(new Date())))
  }, [startDate])

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(durationAsString(startDate, formatISOLocale(new Date())))
    }, 25_000)
    return () => clearInterval(interval)
  }, [startDate])

  return (
    <div className="flex flex-row items-center justify-start gap-1 leading-normal">
      <LucideIcon icon={TimerIcon} size={14} />
      <div>{duration}</div>
    </div>
  )
}
