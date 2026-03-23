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

import { AlertTriangle, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cn } from '~/lib/utils/cn'
import { durationAsString } from '~/lib/utils/duration'
import { type ModelsBooking } from '~/services/api/lasius'

type Props = { item: ModelsBooking }

export const BookingDuration = ({ item }: Props) => {
  const duration = durationAsString(
    item.start.dateTime,
    item.end?.dateTime || '',
  )
  const durationIsZero = duration === '00:00'
  const { t } = useTranslation('common')
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-start gap-1 leading-normal',
        durationIsZero && 'text-warning',
      )}
    >
      <LucideIcon icon={Clock3} size={14} />
      <div>{duration}</div>
      {durationIsZero && (
        <span
          title={t(
            'bookings:warnings.durationIsZero',
            "This booking's duration is zero",
          )}
        >
          <LucideIcon icon={AlertTriangle} size={14} />
        </span>
      )}
    </div>
  )
}
